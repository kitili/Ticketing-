/**
 * Ops Request Desk — Express API + static frontend.
 */

const express = require("express");
const path = require("path");
const { db, DEPARTMENTS, nextRequestId } = require("./db");

const app = express();
const PORT = process.env.PORT || 3847;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function nowIso() {
  return new Date().toISOString();
}

function formatDisplay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

function getSetting(key) {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings(key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`
  ).run(key, value);
}

function hashPin(pin) {
  const crypto = require("crypto");
  const salt = getSetting("pin_salt");
  return crypto.pbkdf2Sync(pin, salt, 120000, 32, "sha256").toString("hex");
}

// --- Auth ---
app.post("/api/login", (req, res) => {
  const { role, department, pin } = req.body || {};
  if (role === "manager") {
    const stored = getSetting("manager_pin_hash");
    if (!pin || hashPin(pin) !== stored) return res.status(401).json({ error: "Invalid manager PIN." });
    return res.json({
      ok: true,
      user: { role: "manager", name: "Operations Manager", department: null },
    });
  }
  if (role === "requester") {
    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({ error: "Invalid department." });
    }
    return res.json({
      ok: true,
      user: { role: "requester", name: null, department },
    });
  }
  res.status(400).json({ error: "Invalid role." });
});

// Manager PIN setup/change
app.get("/api/manager/pin/status", (_req, res) => {
  const stored = getSetting("manager_pin_hash");
  res.json({ configured: Boolean(stored) });
});

app.post("/api/manager/pin/setup", (req, res) => {
  const stored = getSetting("manager_pin_hash");
  const { new_pin } = req.body || {};
  if (!stored) {
    if (!new_pin || String(new_pin).length < 4) return res.status(400).json({ error: "PIN too short." });
    setSetting("manager_pin_hash", hashPin(String(new_pin)));
    return res.json({ ok: true });
  }
  return res.status(400).json({ error: "PIN already configured. Use change-pin." });
});

app.post("/api/manager/pin/change", (req, res) => {
  const { old_pin, new_pin } = req.body || {};
  const stored = getSetting("manager_pin_hash");
  if (!stored) return res.status(400).json({ error: "PIN not configured." });
  if (!old_pin || hashPin(String(old_pin)) !== stored) return res.status(401).json({ error: "Old PIN is incorrect." });
  if (!new_pin || String(new_pin).length < 4) return res.status(400).json({ error: "New PIN too short." });
  setSetting("manager_pin_hash", hashPin(String(new_pin)));
  return res.json({ ok: true });
});

app.get("/api/departments", (_req, res) => {
  res.json({ departments: DEPARTMENTS });
});

app.get("/api/categories", (_req, res) => {
  res.json({
    categories: ["General", "Supplies", "Maintenance", "Transport", "Security", "Farming", "Other"],
    priorities: ["low", "normal", "high", "urgent"],
  });
});

// --- Stats ---
app.get("/api/stats", (_req, res) => {
  const newCount = db
    .prepare("SELECT COUNT(*) AS n FROM requests WHERE status = 'open'")
    .get().n;
  const openCount = db
    .prepare(
      `SELECT COUNT(*) AS n FROM requests WHERE status NOT IN ('closed', 'declined')`
    )
    .get().n;
  res.json({ newCount, openCount });
});

// --- List requests ---
app.get("/api/requests", (req, res) => {
  const { department, status, category, priority, assigned_to } = req.query;
  let sql = "SELECT * FROM requests WHERE 1=1";
  const params = [];

  if (department) {
    sql += " AND department = ?";
    params.push(department);
  }
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (priority) {
    sql += " AND priority = ?";
    params.push(priority);
  }
  if (assigned_to) {
    sql += " AND assigned_to = ?";
    params.push(assigned_to);
  }

  sql +=
    " ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'pending_info' THEN 2 WHEN 'resolved' THEN 3 ELSE 9 END, created_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json({
    requests: rows.map((r) => ({
      ...r,
      created_at_display: formatDisplay(r.created_at),
      updated_at_display: formatDisplay(r.updated_at),
      resolved_at_display: formatDisplay(r.resolved_at),
      closed_at_display: formatDisplay(r.closed_at),
    })),
  });
});

// --- One request + messages ---
app.get("/api/requests/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });
  const messages = db
    .prepare(
      "SELECT * FROM messages WHERE request_id = ? ORDER BY created_at ASC"
    )
    .all(req.params.id);
  res.json({
    request: {
      ...row,
      created_at_display: formatDisplay(row.created_at),
      updated_at_display: formatDisplay(row.updated_at),
      resolved_at_display: formatDisplay(row.resolved_at),
      closed_at_display: formatDisplay(row.closed_at),
    },
    messages: messages.map((m) => ({
      ...m,
      created_at_display: formatDisplay(m.created_at),
    })),
  });
});

// --- Submit ---
app.post("/api/requests", (req, res) => {
  const {
    department,
    requester_name,
    campus,
    title,
    details,
    urgency,
    category,
    priority,
  } = req.body || {};

  if (!department || !requester_name || !title || !details) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (!DEPARTMENTS.includes(department)) {
    return res.status(400).json({ error: "Invalid department." });
  }

  const id = nextRequestId();
  const created_at = nowIso();

  db.prepare(
    `INSERT INTO requests (
      id, department, requester_name, campus, title, details, urgency, status, created_at, category, priority, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`
  ).run(
    id,
    department,
    requester_name.trim(),
    (campus || "").trim(),
    title.trim(),
    details.trim(),
    urgency === "urgent" ? "urgent" : "normal",
    created_at,
    (category || "General").trim(),
    ["low", "normal", "high", "urgent"].includes(priority) ? priority : "normal",
    created_at
  );

  db.prepare(
    `INSERT INTO messages (request_id, author_role, author_name, body, created_at)
     VALUES (?, 'requester', ?, ?, ?)`
  ).run(id, requester_name.trim(), "Request submitted.", created_at);

  res.status(201).json({ id, status: "open", created_at });
});

// --- Update status (manager) ---
const MANAGER_STATUSES = ["open", "in_progress", "pending_info", "resolved", "closed", "declined"];

app.patch("/api/requests/:id", (req, res) => {
  const { status, actor_name, assigned_to, category, priority } = req.body || {};
  if (!MANAGER_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });

  const t = nowIso();
  const name = (actor_name || "Operations Manager").trim();

  const updates = [];
  const params = [];

  updates.push("status = ?");
  params.push(status);

  updates.push("updated_at = ?");
  params.push(t);

  if (row.first_seen_at == null) {
    updates.push("first_seen_at = COALESCE(first_seen_at, ?)");
    params.push(t);
  }

  if (typeof assigned_to === "string") {
    updates.push("assigned_to = ?");
    params.push(assigned_to.trim());
  }
  if (typeof category === "string" && category.trim()) {
    updates.push("category = ?");
    params.push(category.trim());
  }
  if (typeof priority === "string" && ["low", "normal", "high", "urgent"].includes(priority)) {
    updates.push("priority = ?");
    params.push(priority);
  }

  if (status === "resolved") {
    updates.push("resolved_at = ?");
    params.push(t);
    updates.push("resolved_by = ?");
    params.push(name);
  }
  if (status === "closed") {
    updates.push("closed_at = ?");
    params.push(t);
    updates.push("closed_by = ?");
    params.push(name);
  }
  if (status === "declined") {
    updates.push("declined_at = ?");
    params.push(t);
    updates.push("declined_by = ?");
    params.push(name);
  }

  params.push(req.params.id);
  db.prepare(`UPDATE requests SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  res.json({ ok: true, status });
});

// --- Close ticket (requester) ---
app.post("/api/requests/:id/close", (req, res) => {
  const { requester_name, note } = req.body || {};
  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });
  if (row.status !== "resolved") {
    return res
      .status(400)
      .json({ error: "Ticket must be Resolved before you can Close it." });
  }

  const t = nowIso();
  const name = (requester_name || row.requester_name).trim();

  db.prepare(
    `UPDATE requests SET status = 'closed', closed_at = ?, closed_by = ?, updated_at = ? WHERE id = ?`
  ).run(t, name, t, req.params.id);

  if (note && note.trim()) {
    db.prepare(
      `INSERT INTO messages (request_id, author_role, author_name, body, created_at)
       VALUES (?, 'requester', ?, ?, ?)`
    ).run(req.params.id, name, "Closed: " + note.trim(), t);
  } else {
    db.prepare(
      `INSERT INTO messages (request_id, author_role, author_name, body, created_at)
       VALUES (?, 'requester', ?, ?, ?)`
    ).run(req.params.id, name, "Closed by requester.", t);
  }

  res.json({ ok: true, status: "closed" });
});

// --- Reopen ticket (requester) ---
app.post("/api/requests/:id/reopen", (req, res) => {
  const { requester_name, note } = req.body || {};
  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });
  if (!["resolved", "closed"].includes(row.status)) {
    return res.status(400).json({ error: "Only resolved/closed tickets can be reopened." });
  }

  const t = nowIso();
  const name = (requester_name || row.requester_name).trim();

  db.prepare(
    `UPDATE requests SET status = 'open', updated_at = ? WHERE id = ?`
  ).run(t, name, req.params.id);

  db.prepare(
    `INSERT INTO messages (request_id, author_role, author_name, body, created_at)
     VALUES (?, 'requester', ?, ?, ?)`
  ).run(req.params.id, name, note?.trim() ? "Reopened: " + note.trim() : "Ticket reopened.", t);

  res.json({ ok: true, status: "open" });
});

// --- Messages ---
app.post("/api/requests/:id/messages", (req, res) => {
  const { author_role, author_name, body } = req.body || {};
  if (!body || !body.trim()) {
    return res.status(400).json({ error: "Message required." });
  }
  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });

  const t = nowIso();
  db.prepare(
    `INSERT INTO messages (request_id, author_role, author_name, body, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    req.params.id,
    author_role === "manager" ? "manager" : "requester",
    (author_name || "User").trim(),
    body.trim(),
    t
  );

  if (author_role === "manager" && row.status === "open") {
    db.prepare(
      `UPDATE requests SET status = 'in_progress', first_seen_at = COALESCE(first_seen_at, ?), updated_at = ? WHERE id = ?`
    ).run(t, t, req.params.id);
  }

  res.status(201).json({ ok: true, created_at: t });
});

// --- CSV export ---
app.get("/api/export.csv", (req, res) => {
  const { from, to } = req.query;
  let sql = "SELECT * FROM requests WHERE 1=1";
  const params = [];
  if (from) {
    sql += " AND created_at >= ?";
    params.push(from);
  }
  if (to) {
    sql += " AND created_at <= ?";
    params.push(to + "T23:59:59.999Z");
  }
  sql += " ORDER BY created_at ASC";

  const rows = db.prepare(sql).all(...params);
  const headers = [
    "id",
    "department",
    "requester_name",
    "campus",
    "title",
    "category",
    "priority",
    "assigned_to",
    "status",
    "created_at",
    "first_seen_at",
    "updated_at",
    "resolved_at",
    "resolved_by",
    "closed_at",
    "closed_by",
    "declined_at",
    "declined_by",
    "details",
  ];

  function esc(val) {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="ops-requests-export.csv"'
  );
  res.send(lines.join("\n"));
});

app.listen(PORT, () => {
  console.log(`Ops Request Desk → http://localhost:${PORT}`);
});
