/**
 * Supabase client + crypto helpers.
 */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const DEPARTMENTS = ["Transport", "Facilities", "Kitchen", "Security", "Farms"];
export const CATEGORIES = ["General", "Supplies", "Maintenance", "Transport", "Security", "Farming", "Other"];
export const PRIORITIES = ["low", "normal", "high", "urgent"];

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("YOUR_PROJECT")) {
    throw new Error(
      "Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (see README)."
    );
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function formatDisplay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 120000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function getSetting(key) {
  assertConfigured();
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value ?? null;
}

async function setSetting(key, value) {
  const { error } = await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

function mapRequest(row) {
  if (!row) return row;
  return {
    ...row,
    created_at_display: formatDisplay(row.created_at),
    updated_at_display: formatDisplay(row.updated_at),
    resolved_at_display: formatDisplay(row.resolved_at),
    closed_at_display: formatDisplay(row.closed_at),
  };
}

function mapMessage(m) {
  return { ...m, created_at_display: formatDisplay(m.created_at) };
}

async function nextRequestId() {
  const { data, error } = await supabase
    .from("requests")
    .select("id")
    .like("id", "REQ-%")
    .order("id", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  let max = 0;
  for (const r of data || []) {
    const m = /^REQ-(\d+)$/.exec(r.id);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return "REQ-" + String(max + 1).padStart(3, "0");
}

export async function login(body) {
  const { role, department, pin } = body || {};
  if (role === "manager") {
    const stored = await getSetting("manager_pin_hash");
    const salt = await getSetting("pin_salt");
    if (!stored || !salt) throw new Error("Manager PIN not configured in Supabase.");
    const h = await hashPin(String(pin || ""), salt);
    if (h !== stored) throw new Error("Invalid manager PIN.");
    return { ok: true, user: { role: "manager", name: "Operations Manager", department: null } };
  }
  if (role === "requester") {
    if (!DEPARTMENTS.includes(department)) throw new Error("Invalid department.");
    return { ok: true, user: { role: "requester", name: null, department } };
  }
  throw new Error("Invalid role.");
}

export async function getManagerPinStatus() {
  const stored = await getSetting("manager_pin_hash");
  return { configured: Boolean(stored && !stored.includes("PLACEHOLDER")) };
}

export async function changeManagerPin(old_pin, new_pin) {
  if (!new_pin || String(new_pin).length < 4) throw new Error("New PIN too short.");
  const salt = await getSetting("pin_salt");
  const stored = await getSetting("manager_pin_hash");
  if (!salt || !stored) throw new Error("PIN not configured.");
  const oldHash = await hashPin(String(old_pin), salt);
  if (oldHash !== stored) throw new Error("Old PIN is incorrect.");
  await setSetting("manager_pin_hash", await hashPin(String(new_pin), salt));
  return { ok: true };
}

export async function getDepartments() {
  return { departments: DEPARTMENTS };
}

export async function getTicketMeta() {
  return { categories: CATEGORIES, priorities: PRIORITIES };
}

export async function getStats() {
  assertConfigured();
  const { data, error } = await supabase.from("requests").select("status");
  if (error) throw new Error(error.message);
  const rows = data || [];
  const newCount = rows.filter((r) => r.status === "open").length;
  const openCount = rows.filter((r) => !["closed", "declined"].includes(r.status)).length;
  return { newCount, openCount };
}

export async function listRequests(params = {}) {
  assertConfigured();
  let q = supabase.from("requests").select("*");
  if (params.department) q = q.eq("department", params.department);
  if (params.status) q = q.eq("status", params.status);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const order = { open: 0, in_progress: 1, pending_info: 2, resolved: 3 };
  const sorted = (data || []).sort((a, b) => {
    const sa = order[a.status] ?? 9;
    const sb = order[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  return { requests: sorted.map(mapRequest) };
}

export async function getRequest(id) {
  assertConfigured();
  const { data: request, error: e1 } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!request) throw new Error("Not found.");
  const { data: messages, error: e2 } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });
  if (e2) throw new Error(e2.message);
  return { request: mapRequest(request), messages: (messages || []).map(mapMessage) };
}

export async function submitRequest(body) {
  assertConfigured();
  const {
    department,
    requester_name,
    campus,
    title,
    details,
    category,
    priority,
  } = body || {};
  if (!department || !requester_name || !title || !details) {
    throw new Error("Missing required fields.");
  }
  if (!DEPARTMENTS.includes(department)) throw new Error("Invalid department.");

  const id = await nextRequestId();
  const now = new Date().toISOString();
  const row = {
    id,
    department,
    requester_name: requester_name.trim(),
    campus: (campus || "").trim(),
    title: title.trim(),
    details: details.trim(),
    urgency: priority === "urgent" ? "urgent" : "normal",
    category: (category || "General").trim(),
    priority: PRIORITIES.includes(priority) ? priority : "normal",
    status: "open",
    created_at: now,
    updated_at: now,
  };

  const { error: e1 } = await supabase.from("requests").insert(row);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase.from("messages").insert({
    request_id: id,
    author_role: "requester",
    author_name: row.requester_name,
    body: "Ticket opened.",
    created_at: now,
  });
  if (e2) throw new Error(e2.message);

  return { id, status: "open", created_at: now };
}

export async function patchStatus(id, body) {
  assertConfigured();
  const { status, actor_name } = body || {};
  const allowed = ["open", "in_progress", "pending_info", "resolved", "closed", "declined"];
  if (!allowed.includes(status)) throw new Error("Invalid status.");

  const { data: row, error: e0 } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (e0) throw new Error(e0.message);
  if (!row) throw new Error("Not found.");

  const t = new Date().toISOString();
  const name = (actor_name || "Operations Manager").trim();
  const patch = { status, updated_at: t };

  if (!row.first_seen_at) patch.first_seen_at = t;
  if (status === "resolved") {
    patch.resolved_at = t;
    patch.resolved_by = name;
  }
  if (status === "closed") {
    patch.closed_at = t;
    patch.closed_by = name;
  }
  if (status === "declined") {
    patch.declined_at = t;
    patch.declined_by = name;
  }

  const { error } = await supabase.from("requests").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true, status };
}

export async function markReceived(id, body) {
  assertConfigured();
  const { requester_name, note } = body || {};
  const { data: row, error: e0 } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (e0) throw new Error(e0.message);
  if (!row) throw new Error("Not found.");
  if (row.status !== "resolved") throw new Error("Ticket must be Resolved before you can Close it.");

  const t = new Date().toISOString();
  const name = (requester_name || row.requester_name).trim();
  const { error: e1 } = await supabase
    .from("requests")
    .update({ status: "closed", closed_at: t, closed_by: name, updated_at: t })
    .eq("id", id);
  if (e1) throw new Error(e1.message);

  await supabase.from("messages").insert({
    request_id: id,
    author_role: "requester",
    author_name: name,
    body: note?.trim() ? "Closed: " + note.trim() : "Closed by requester.",
    created_at: t,
  });
  return { ok: true, status: "closed" };
}

export async function reopenTicket(id, body) {
  assertConfigured();
  const { requester_name, note } = body || {};
  const { data: row, error: e0 } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (e0) throw new Error(e0.message);
  if (!row) throw new Error("Not found.");
  if (!["resolved", "closed"].includes(row.status)) {
    throw new Error("Only resolved/closed tickets can be reopened.");
  }

  const t = new Date().toISOString();
  const name = (requester_name || row.requester_name).trim();
  const { error } = await supabase.from("requests").update({ status: "open", updated_at: t }).eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("messages").insert({
    request_id: id,
    author_role: "requester",
    author_name: name,
    body: note?.trim() ? "Reopened: " + note.trim() : "Ticket reopened.",
    created_at: t,
  });
  return { ok: true, status: "open" };
}

export async function postMessage(id, body) {
  assertConfigured();
  const { author_role, author_name, body: text } = body || {};
  if (!text?.trim()) throw new Error("Message required.");

  const { data: row, error: e0 } = await supabase.from("requests").select("status, first_seen_at").eq("id", id).maybeSingle();
  if (e0) throw new Error(e0.message);
  if (!row) throw new Error("Not found.");

  const t = new Date().toISOString();
  const { error: e1 } = await supabase.from("messages").insert({
    request_id: id,
    author_role: author_role === "manager" ? "manager" : "requester",
    author_name: (author_name || "User").trim(),
    body: text.trim(),
    created_at: t,
  });
  if (e1) throw new Error(e1.message);

  if (author_role === "manager" && row.status === "open") {
    await supabase
      .from("requests")
      .update({
        status: "in_progress",
        first_seen_at: row.first_seen_at || t,
        updated_at: t,
      })
      .eq("id", id);
  }
  return { ok: true, created_at: t };
}

export async function downloadCsv(from, to) {
  assertConfigured();
  let q = supabase.from("requests").select("*").order("created_at", { ascending: true });
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to + "T23:59:59.999Z");
  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const headers = [
    "id", "department", "requester_name", "campus", "title", "category", "priority",
    "assigned_to", "status", "created_at", "resolved_at", "closed_at", "details",
  ];
  function esc(val) {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  const lines = [headers.join(",")];
  for (const r of data || []) {
    lines.push(headers.map((h) => esc(r[h])).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ops-tickets-export.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
