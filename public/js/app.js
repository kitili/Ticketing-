/**
 * Ops Request Desk — main application.
 */

import * as api from "./api.js";
import { isOnline, onConnectivityChange } from "./connectivity.js";
import { startAutoSync, syncNow } from "./sync.js";
import * as store from "./offline-store.js";
import {
  showToast,
  statusLabel,
  statusClass,
  escapeHtml,
  renderRequestTable,
  renderMessages,
} from "./ui.js";

const SESSION_KEY = "ops_desk_user";
const connBar = document.getElementById("connectivity-bar");
const btnSync = document.getElementById("btn-sync");

let user = null;
let currentView = "list";
let selectedId = null;

// --- Session ---
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(u) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(u));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  user = null;
}

async function updateConnectivityBar() {
  if (!connBar) return;
  const pending = await store.outboxCount();
  const online = isOnline();

  if (!online) {
    connBar.textContent =
      pending > 0
        ? "Offline — " + pending + " change(s) queued. They will sync when you are back online."
        : "Offline — you can still open tickets and work from cached data.";
    connBar.className = "connectivity-bar";
    connBar.classList.remove("hidden");
  } else if (pending > 0) {
    connBar.textContent = "Online — " + pending + " change(s) waiting to sync.";
    connBar.className = "connectivity-bar online-pending";
    connBar.classList.remove("hidden");
  } else {
    connBar.classList.add("hidden");
  }

  if (btnSync) {
    btnSync.classList.toggle("hidden", !pending || !online);
  }
}

function setupConnectivity() {
  onConnectivityChange(() => {
    updateConnectivityBar();
    if (isOnline()) syncNow().then(refreshCurrentView).catch(() => {});
  });
  if (btnSync) {
    btnSync.addEventListener("click", async () => {
      btnSync.disabled = true;
      try {
        const { synced, errors } = await syncNow();
        if (errors.length) {
          showToast("Sync partly failed: " + errors[0].message, "error");
        } else if (synced) {
          showToast("Synced " + synced + " item(s).", "success");
        } else {
          showToast("Nothing to sync.", "success");
        }
        await updateConnectivityBar();
        refreshCurrentView();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        btnSync.disabled = false;
      }
    });
  }
  updateConnectivityBar();
  setInterval(updateConnectivityBar, 8000);
}

function refreshCurrentView() {
  if (!user) return;
  if (user.role === "manager") {
    loadManagerInbox();
    if (selectedId) openManagerDetail(selectedId);
    refreshBadge();
  } else {
    loadRequesterList();
    if (selectedId) openRequesterDetail(selectedId);
  }
}

// --- Screens ---
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");

function showLogin() {
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function showApp() {
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  updateConnectivityBar();
  updateHeader();
  if (user.role === "manager") {
    initManager();
  } else {
    initRequester();
  }
}

function updateHeader() {
  const title = document.getElementById("header-title");
  const meta = document.getElementById("header-meta");
  const badge = document.getElementById("badge-new");
  const buildEl = document.getElementById("build-id");
  const buildId = globalThis.__SL_ENV__?.BUILD_ID;
  if (buildEl && buildId) {
    buildEl.textContent = "build " + buildId;
    buildEl.classList.remove("hidden");
  }

  if (user.role === "manager") {
    title.textContent = "Ops Ticket Desk — Manager";
    meta.textContent = "All departments";
    refreshBadge();
  } else {
    title.textContent = "Ops Ticket Desk — " + user.department;
    meta.textContent = user.requesterName
      ? user.requesterName + " · " + user.department
      : user.department;
    badge.classList.add("hidden");
  }
}

async function refreshBadge() {
  if (user?.role !== "manager") return;
  try {
    const { newCount } = await api.getStats();
    const badge = document.getElementById("badge-new");
    if (newCount > 0) {
      badge.textContent = newCount + " new";
      badge.classList.remove("hidden");
      document.title = "(" + newCount + ") Ops Tickets";
    } else {
      badge.classList.add("hidden");
      document.title = "Ops Ticket Desk";
    }
  } catch {
    /* ignore */
  }
}

// --- Login ---
const roleSelect = document.getElementById("login-role");
const deptWrap = document.getElementById("dept-wrap");
const deptSelect = document.getElementById("login-department");
const pinWrap = document.getElementById("pin-wrap");
const pinHint = document.getElementById("pin-hint");

roleSelect.addEventListener("change", () => {
  deptWrap.classList.toggle("hidden", roleSelect.value !== "requester");
  pinWrap.classList.toggle("hidden", roleSelect.value !== "manager");
  if (roleSelect.value !== "manager") {
    document.getElementById("login-pin").value = "";
  }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const role = roleSelect.value;
  const pin = document.getElementById("login-pin").value;
  const department = deptSelect.value;
  try {
    const { user: u } = await api.login({
      role,
      department,
      pin: role === "manager" ? pin : undefined,
    });
    user = {
      ...u,
      requesterName: role === "requester" ? document.getElementById("login-name").value.trim() : null,
    };
    if (role === "requester" && !user.requesterName) {
      showToast("Enter your name.", "error");
      return;
    }
    // manager PIN validation happens server-side; keep UI simple
    saveSession(user);
    showApp();
    showToast("Welcome!", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  clearSession();
  showLogin();
});

// --- Requester ---
function initRequester() {
  document.getElementById("panel-manager").classList.add("hidden");
  document.getElementById("panel-requester").classList.remove("hidden");

  const deptField = document.getElementById("submit-department");
  if (!deptField.options.length) {
    deptField.innerHTML = `<option value="${escapeHtml(user.department)}">${escapeHtml(user.department)}</option>`;
  }
  deptField.value = user.department;
  deptField.disabled = true;

  document.getElementById("submit-name").value = user.requesterName || "";

  setupRequesterTabs();
  loadRequesterList();
}

function setupRequesterTabs() {
  const tabs = document.querySelectorAll("#panel-requester .tab-btn");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      document.getElementById("req-tab-submit").classList.toggle("hidden", tab !== "submit");
      document.getElementById("req-tab-list").classList.toggle("hidden", tab !== "list");
      document.getElementById("req-tab-detail").classList.toggle("hidden", tab !== "detail");
      if (tab === "list") loadRequesterList();
    });
  });
}

document.getElementById("submit-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    department: user.department,
    requester_name: document.getElementById("submit-name").value.trim(),
    campus: document.getElementById("submit-campus").value.trim(),
    title: document.getElementById("submit-title").value.trim(),
    details: document.getElementById("submit-details").value.trim(),
    category: document.getElementById("submit-category").value,
    priority: document.getElementById("submit-priority").value,
  };
  try {
    const res = await api.submitRequest(body);
    user.requesterName = body.requester_name;
    saveSession(user);
    showToast(
      res._queued ? "Ticket " + res.id + " saved offline — will sync when online." : "Ticket " + res.id + " opened.",
      "success"
    );
    updateConnectivityBar();
    e.target.reset();
    document.getElementById("submit-department").value = user.department;
    document.getElementById("submit-name").value = body.requester_name;
    loadRequesterList();
    openRequesterDetail(res.id);
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function loadRequesterList() {
  const wrap = document.getElementById("requester-list");
  wrap.innerHTML = "<p class=\"hint\">Loading…</p>";
  try {
    const { requests } = await api.listRequests({ department: user.department });
    renderRequestTable(wrap, requests, openRequesterDetail);
  } catch (err) {
    wrap.innerHTML = "<p class=\"hint\">" + escapeHtml(err.message) + "</p>";
  }
}

async function openRequesterDetail(id) {
  selectedId = id;
  document.querySelectorAll("#panel-requester .tab-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById("req-tab-submit").classList.add("hidden");
  document.getElementById("req-tab-list").classList.add("hidden");
  document.getElementById("req-tab-detail").classList.remove("hidden");

  const panel = document.getElementById("requester-detail");
  panel.innerHTML = "<p class=\"hint\">Loading…</p>";

  try {
    const { request, messages } = await api.getRequest(id);
    const canClose = request.status === "resolved";
    const canReopen = request.status === "resolved" || request.status === "closed";

    panel.innerHTML = `
      <span class="back-link" id="back-requester-list">← Back to my requests</span>
      <h2>${escapeHtml(request.id)} — ${escapeHtml(request.title)}</h2>
      <dl class="detail-grid">
        <dt>Status</dt><dd><span class="${statusClass(request.status)}">${statusLabel(request.status)}</span></dd>
        <dt>Opened</dt><dd>${escapeHtml(request.created_at_display)}</dd>
        <dt>Category</dt><dd>${escapeHtml(request.category || "General")}</dd>
        <dt>Priority</dt><dd>${escapeHtml(request.priority || "normal")}</dd>
        <dt>Details</dt><dd>${escapeHtml(request.details)}</dd>
      </dl>
      <div class="messages" id="req-messages"></div>
      <div class="card" style="margin-top:1rem">
        <label for="req-reply">Add comment</label>
        <textarea id="req-reply" placeholder="Add a note…"></textarea>
        <button type="button" class="btn btn-secondary" id="btn-req-msg">Send comment</button>
      </div>
      ${
        canClose
          ? `<div class="card">
        <h2>Close ticket</h2>
        <p class="hint">Operations marked this ticket as resolved. Close it if everything is okay.</p>
        <textarea id="receive-note" placeholder="Optional closing note"></textarea>
        <button type="button" class="btn btn-success" id="btn-received">Close ticket</button>
      </div>`
          : ""
      }
      ${
        canReopen
          ? `<div class="card">
        <h2>Reopen</h2>
        <p class="hint">If the issue is not fixed, reopen the ticket.</p>
        <textarea id="reopen-note" placeholder="Optional note"></textarea>
        <button type="button" class="btn btn-danger" id="btn-reopen">Reopen ticket</button>
      </div>`
          : ""
      }`;

    renderMessages(document.getElementById("req-messages"), messages);

    document.getElementById("back-requester-list").addEventListener("click", () => {
      document.getElementById("req-tab-detail").classList.add("hidden");
      document.getElementById("req-tab-list").classList.remove("hidden");
      document.querySelector('#panel-requester .tab-btn[data-tab="list"]').classList.add("active");
      loadRequesterList();
    });

    document.getElementById("btn-req-msg")?.addEventListener("click", async () => {
      const body = document.getElementById("req-reply").value;
      if (!body.trim()) return;
      try {
        const res = await api.postMessage(id, {
          author_role: "requester",
          author_name: user.requesterName || request.requester_name,
          body,
        });
        showToast(res._queued ? "Comment queued for sync." : "Message sent.", "success");
        updateConnectivityBar();
        openRequesterDetail(id);
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    document.getElementById("btn-received")?.addEventListener("click", async () => {
      try {
        const res = await api.markReceived(id, {
          requester_name: user.requesterName || request.requester_name,
          note: document.getElementById("receive-note")?.value || "",
        });
        showToast(res._queued ? "Close queued for sync." : "Ticket closed.", "success");
        updateConnectivityBar();
        openRequesterDetail(id);
        loadRequesterList();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    document.getElementById("btn-reopen")?.addEventListener("click", async () => {
      try {
        const res = await api.reopenTicket(id, {
          requester_name: user.requesterName || request.requester_name,
          note: document.getElementById("reopen-note")?.value || "",
        });
        showToast(res._queued ? "Reopen queued for sync." : "Ticket reopened.", "success");
        updateConnectivityBar();
        openRequesterDetail(id);
        loadRequesterList();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  } catch (err) {
    panel.innerHTML = "<p class=\"hint\">" + escapeHtml(err.message) + "</p>";
  }
}

// --- Manager ---
function initManager() {
  document.getElementById("panel-requester").classList.add("hidden");
  document.getElementById("panel-manager").classList.remove("hidden");
  setupManagerTabs();
  loadManagerInbox();
}

function setupManagerTabs() {
  const tabs = document.querySelectorAll("#panel-manager .tab-btn");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      document.getElementById("mgr-tab-inbox").classList.toggle("hidden", tab !== "inbox");
      document.getElementById("mgr-tab-detail").classList.toggle("hidden", tab !== "detail");
      document.getElementById("mgr-tab-export").classList.toggle("hidden", tab !== "export");
      document.getElementById("mgr-tab-settings").classList.toggle("hidden", tab !== "settings");
      if (tab === "inbox") loadManagerInbox();
    });
  });
}

document.getElementById("mgr-filter-apply").addEventListener("click", loadManagerInbox);
document.getElementById("mgr-filter-clear").addEventListener("click", () => {
  document.getElementById("mgr-filter-dept").value = "";
  document.getElementById("mgr-filter-status").value = "";
  loadManagerInbox();
});

async function loadManagerInbox() {
  const wrap = document.getElementById("manager-list");
  wrap.innerHTML = "<p class=\"hint\">Loading…</p>";
  const params = {};
  const dept = document.getElementById("mgr-filter-dept").value;
  const status = document.getElementById("mgr-filter-status").value;
  if (dept) params.department = dept;
  if (status) params.status = status;

  try {
    const { requests } = await api.listRequests(params);
    renderRequestTable(wrap, requests, openManagerDetail);
    refreshBadge();
  } catch (err) {
    wrap.innerHTML = "<p class=\"hint\">" + escapeHtml(err.message) + "</p>";
  }
}

async function openManagerDetail(id) {
  selectedId = id;
  document.getElementById("mgr-tab-inbox").classList.add("hidden");
  document.getElementById("mgr-tab-detail").classList.remove("hidden");
  document.querySelectorAll("#panel-manager .tab-btn").forEach((b) => b.classList.remove("active"));

  const panel = document.getElementById("manager-detail");
  panel.innerHTML = "<p class=\"hint\">Loading…</p>";

  try {
    const { request, messages } = await api.getRequest(id);
    const closed = request.status === "closed" || request.status === "declined";

    panel.innerHTML = `
      <span class="back-link" id="back-manager-inbox">← Back to inbox</span>
      <h2>${escapeHtml(request.id)} — ${escapeHtml(request.title)}</h2>
      <dl class="detail-grid">
        <dt>Department</dt><dd>${escapeHtml(request.department)} · ${escapeHtml(request.requester_name)}</dd>
        <dt>Status</dt><dd><span class="${statusClass(request.status)}">${statusLabel(request.status)}</span></dd>
        <dt>Campus</dt><dd>${escapeHtml(request.campus || "—")}</dd>
        <dt>Category</dt><dd>${escapeHtml(request.category || "General")}</dd>
        <dt>Priority</dt><dd>${escapeHtml(request.priority || "normal")}${request.priority === "urgent" ? ' <span class="urgent-tag">URGENT</span>' : ""}</dd>
        <dt>Assigned to</dt><dd>${escapeHtml(request.assigned_to || "—")}</dd>
        <dt>Opened</dt><dd>${escapeHtml(request.created_at_display)}</dd>
        <dt>Resolved</dt><dd>${escapeHtml(request.resolved_at_display || "—")}</dd>
        <dt>Closed</dt><dd>${escapeHtml(request.closed_at_display || "—")} ${request.closed_by ? "by " + escapeHtml(request.closed_by) : ""}</dd>
        <dt>Details</dt><dd>${escapeHtml(request.details)}</dd>
      </dl>
      ${
        !closed
          ? `<div class="btn-group">
        <button type="button" class="btn btn-secondary btn-sm" data-status="in_progress">In progress</button>
        <button type="button" class="btn btn-secondary btn-sm" data-status="pending_info">Pending info</button>
        <button type="button" class="btn btn-success btn-sm" data-status="resolved">Resolve</button>
        <button type="button" class="btn btn-danger btn-sm" data-status="declined">Decline</button>
      </div>`
          : ""
      }
      <div class="messages" id="mgr-messages"></div>
      <div class="card" style="margin-top:1rem">
        <label for="mgr-reply">Add comment / response</label>
        <textarea id="mgr-reply" placeholder="Your response…"></textarea>
        <button type="button" class="btn btn-primary" id="btn-mgr-msg">Send</button>
      </div>`;

    renderMessages(document.getElementById("mgr-messages"), messages);

    document.getElementById("back-manager-inbox").addEventListener("click", () => {
      document.getElementById("mgr-tab-detail").classList.add("hidden");
      document.getElementById("mgr-tab-inbox").classList.remove("hidden");
      document.querySelector('#panel-manager .tab-btn[data-tab="inbox"]').classList.add("active");
      loadManagerInbox();
    });

    panel.querySelectorAll("[data-status]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const status = btn.getAttribute("data-status");
        if (status === "declined" && !confirm("Decline this ticket?")) return;
        try {
          const res = await api.patchStatus(id, {
            status,
            actor_name: "Operations Manager",
          });
          showToast(res._queued ? "Status queued for sync." : "Status: " + statusLabel(status), "success");
          updateConnectivityBar();
          openManagerDetail(id);
          refreshBadge();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    document.getElementById("btn-mgr-msg").addEventListener("click", async () => {
      const body = document.getElementById("mgr-reply").value;
      if (!body.trim()) return;
      try {
        const res = await api.postMessage(id, {
          author_role: "manager",
          author_name: "Operations Manager",
          body,
        });
        showToast(res._queued ? "Reply queued for sync." : "Reply sent.", "success");
        updateConnectivityBar();
        openManagerDetail(id);
        refreshBadge();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  } catch (err) {
    panel.innerHTML = "<p class=\"hint\">" + escapeHtml(err.message) + "</p>";
  }
}

document.getElementById("btn-export-sheets").addEventListener("click", async () => {
  const from = document.getElementById("export-from").value;
  const to = document.getElementById("export-to").value;
  try {
    const { count } = await api.exportForGoogleSheets(from, to);
    showToast(
      count + " ticket(s) copied — paste into cell A1 in the new Google Sheet (Ctrl+V).",
      "success"
    );
  } catch (err) {
    showToast(err.message, "error");
  }
});

document.getElementById("btn-export-csv").addEventListener("click", async () => {
  const from = document.getElementById("export-from").value;
  const to = document.getElementById("export-to").value;
  try {
    await api.downloadCsv(from, to);
    showToast("CSV downloaded.", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
});

document.getElementById("btn-change-pin").addEventListener("click", async () => {
  const oldPin = document.getElementById("old-pin").value;
  const newPin = document.getElementById("new-pin").value;
  try {
    await api.changeManagerPin(oldPin, newPin);
    document.getElementById("old-pin").value = "";
    document.getElementById("new-pin").value = "";
    showToast("Manager PIN updated.", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
});

function isLocalDev() {
  const h = location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

function localSetupMessage() {
  return (
    "Database not connected. On this computer, edit public/js/config.js: " +
    "copy public/js/config.example.js if needed, then paste your Supabase Project URL and Publishable key " +
    "(Supabase → Settings → API Keys). Save the file and refresh this page. " +
    "If errors persist, hard-refresh (Ctrl+Shift+R) or clear site data for localhost."
  );
}

async function clearStaleServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) await r.unregister();
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}

function showSetupError(msg) {
  const el = document.getElementById("setup-error");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function initStaticFormOptions() {
  const deptOpts = api.DEPARTMENTS.map(
    (d) => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`
  ).join("");
  deptSelect.innerHTML = deptOpts;
  document.getElementById("mgr-filter-dept").innerHTML =
    '<option value="">All departments</option>' + deptOpts;

  const catOpts = api.CATEGORIES.map(
    (c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`
  ).join("");
  document.getElementById("submit-category").innerHTML = catOpts;

  const prOpts = api.PRIORITIES.map(
    (p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`
  ).join("");
  document.getElementById("submit-priority").innerHTML = prOpts;
}

// --- Boot ---
async function boot() {
  initStaticFormOptions();
  deptWrap.classList.toggle("hidden", roleSelect.value !== "requester");
  pinWrap.classList.toggle("hidden", roleSelect.value !== "manager");

  if (!api.isConfigured()) {
    if (isLocalDev()) {
      await clearStaleServiceWorker();
      showSetupError(localSetupMessage());
    } else {
      showSetupError(
        "Supabase is not connected on this site. Netlify → Site configuration → Environment variables: add SUPABASE_URL (Project URL) and SUPABASE_ANON_KEY (Publishable key from Supabase → API Keys — not Secret). Save, then Deploys → Trigger deploy → Deploy site. After deploy, open " +
          location.origin +
          "/js/env.js — your Project URL must appear there, not empty quotes. See SETUP-SUPABASE.md in the repo."
      );
    }
    showLogin();
    return;
  }

  setupConnectivity();
  startAutoSync();

  try {
    await api.refreshPinCache();
    const pinStatus = await api.getManagerPinStatus();
    if (!pinStatus.configured) {
      pinHint.textContent = "Run supabase/schema.sql in Supabase SQL Editor (sets manager PIN Ops2026).";
    } else if (!isOnline()) {
      pinHint.textContent = "Offline mode — manager PIN uses last cached settings.";
    }
  } catch (err) {
    if (!isOnline()) {
      pinHint.textContent = "Offline — sign in as department staff without network, or manager after one online login.";
    } else {
      pinHint.textContent = "Cannot reach Supabase: " + err.message;
    }
  }

  user = loadSession();
  if (user) {
    showApp();
  } else {
    showLogin();
  }
}

boot().catch((err) => {
  initStaticFormOptions();
  showSetupError("App failed to start: " + err.message);
  showLogin();
});
