# Silverleaf Ops Request Desk — Build Outline

Simple stack: **HTML + CSS + JavaScript** (frontend) · **Node.js + Express + SQLite** (backend).

---

## Phase 1 — Foundation
- [x] 1.1 Project folder structure
- [x] 1.2 `package.json` and dependencies
- [x] 1.3 SQLite database schema
- [x] 1.4 Seed departments and demo PINs

## Phase 2 — Backend API
- [x] 2.1 `POST /api/login` — PIN + role
- [x] 2.2 `POST /api/requests` — submit new request
- [x] 2.3 `GET /api/requests` — list (filter by department / status)
- [x] 2.4 `GET /api/requests/:id` — one request + messages
- [x] 2.5 `PATCH /api/requests/:id` — update status (manager)
- [x] 2.6 `POST /api/requests/:id/messages` — add reply
- [x] 2.7 `GET /api/requests/:id/received` — mark received (requester)
- [x] 2.8 `GET /api/export.csv` — download by date range
- [x] 2.9 `GET /api/stats` — new count for manager badge

## Phase 3 — Authentication
- [x] 3.1 Login screen (role + department + PIN)
- [x] 3.2 Session in `sessionStorage`
- [x] 3.3 Logout

## Phase 4 — Requester (5 departments)
- [x] 4.1 Submit request form
- [x] 4.2 My requests table
- [x] 4.3 View request detail + manager replies
- [x] 4.4 Confirm received button

## Phase 5 — Operations Manager
- [x] 5.1 Inbox (all requests, new first)
- [x] 5.2 Filters: department, status
- [x] 5.3 Request detail + reply box
- [x] 5.4 Status buttons: In review → Approved → Delivered → Declined
- [x] 5.5 New-request badge count
- [x] 5.6 Export CSV panel

## Phase 6 — Polish
- [x] 6.1 Status badges and timestamps
- [x] 6.2 Toast notifications
- [x] 6.3 README (run locally)

---

## Request lifecycle (statuses)

| Status | Who sets it | Meaning |
|--------|-------------|---------|
| `new` | System on submit | Manager has not acted |
| `in_review` | Manager | Seen / working on it |
| `approved` | Manager | Will arrange / order |
| `delivered` | Manager | Sent or done on Ops side |
| `received` | Requester | Department confirmed |
| `declined` | Manager | Not proceeding |

---

## Departments

Transport · Facilities · Kitchen · Security · Farms

---

## Default PINs (change in production)

| Role | PIN |
|------|-----|
| Operations Manager | `ops2026` |
| Any department (shared) | `dept2026` |
