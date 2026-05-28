/**
 * API helpers — all calls to the Node backend.
 */

const API = "";

export async function login(body) {
  const res = await fetch(API + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function getManagerPinStatus() {
  const res = await fetch(API + "/api/manager/pin/status");
  return res.json();
}

export async function setupManagerPin(new_pin) {
  const res = await fetch(API + "/api/manager/pin/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_pin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Setup failed");
  return data;
}

export async function changeManagerPin(old_pin, new_pin) {
  const res = await fetch(API + "/api/manager/pin/change", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_pin, new_pin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Change failed");
  return data;
}

export async function getDepartments() {
  const res = await fetch(API + "/api/departments");
  return res.json();
}

export async function getTicketMeta() {
  const res = await fetch(API + "/api/categories");
  return res.json();
}

export async function getStats() {
  const res = await fetch(API + "/api/stats");
  return res.json();
}

export async function listRequests(params = {}) {
  const q = new URLSearchParams(params);
  const res = await fetch(API + "/api/requests?" + q);
  if (!res.ok) throw new Error("Could not load requests");
  return res.json();
}

export async function getRequest(id) {
  const res = await fetch(API + "/api/requests/" + encodeURIComponent(id));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Not found");
  return data;
}

export async function submitRequest(body) {
  const res = await fetch(API + "/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Submit failed");
  return data;
}

export async function patchStatus(id, body) {
  const res = await fetch(API + "/api/requests/" + encodeURIComponent(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Update failed");
  return data;
}

export async function markReceived(id, body) {
  const res = await fetch(API + "/api/requests/" + encodeURIComponent(id) + "/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not confirm");
  return data;
}

export async function reopenTicket(id, body) {
  const res = await fetch(API + "/api/requests/" + encodeURIComponent(id) + "/reopen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not reopen");
  return data;
}

export async function postMessage(id, body) {
  const res = await fetch(API + "/api/requests/" + encodeURIComponent(id) + "/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Message failed");
  return data;
}

export function exportCsvUrl(from, to) {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  return API + "/api/export.csv?" + q;
}
