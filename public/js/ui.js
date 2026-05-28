/**
 * DOM helpers — toasts, status labels, tables.
 */

export function showToast(message, type = "") {
  const el = document.createElement("div");
  el.className = "toast" + (type ? " " + type : "");
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

export function statusLabel(status) {
  const labels = {
    open: "Open",
    in_progress: "In progress",
    pending_info: "Pending info",
    resolved: "Resolved",
    closed: "Closed",
    declined: "Declined",
  };
  return labels[status] || status;
}

export function statusClass(status) {
  return "status status-" + status;
}

export function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

export function renderRequestTable(container, requests, onRowClick) {
  if (!requests.length) {
    container.innerHTML = "<p class=\"hint\">No tickets yet.</p>";
    return;
  }

  const rows = requests
    .map(
      (r) => `
    <tr class="row-click" data-id="${escapeHtml(r.id)}">
      <td><strong>${escapeHtml(r.id)}</strong></td>
      <td>${escapeHtml(r.department)}</td>
      <td>${escapeHtml(r.title)}${r.priority === "urgent" || r.urgency === "urgent" ? ' <span class="urgent-tag">URGENT</span>' : ""}</td>
      <td><span class="${statusClass(r.status)}">${statusLabel(r.status)}</span></td>
      <td>${escapeHtml(r.created_at_display || r.created_at?.slice(0, 16) || "")}</td>
    </tr>`
    )
    .join("");

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Department</th>
            <th>Request</th>
            <th>Status</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  container.querySelectorAll(".row-click").forEach((tr) => {
    tr.addEventListener("click", () => onRowClick(tr.getAttribute("data-id")));
  });
}

export function renderMessages(container, messages) {
  if (!messages.length) {
    container.innerHTML = "<p class=\"hint\">No messages yet.</p>";
    return;
  }
  container.innerHTML = messages
    .map(
      (m) => `
    <div class="message message-${m.author_role === "manager" ? "manager" : "requester"}">
      <div class="message-meta">${escapeHtml(m.author_name)} · ${escapeHtml(m.created_at_display || "")}</div>
      <div>${escapeHtml(m.body)}</div>
    </div>`
    )
    .join("");
}
