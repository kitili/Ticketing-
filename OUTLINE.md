# Silverleaf Ops Ticket Desk — Build Outline

**Production:** Static JS + Supabase + Netlify (see DEPLOY.md)

---

## Phase 1 — Foundation
- [x] Project folder structure
- [x] Frontend (HTML/CSS/JS)
- [x] Supabase schema (`supabase/schema.sql`)
- [x] Netlify deploy config

## Phase 2 — Data layer (Supabase)
- [x] requests + messages + settings tables
- [x] Manager PIN (PBKDF2, default Ops2026)
- [x] RLS policies for anon access (internal tool)

## Phase 3 — Ticket workflow
- [x] Open → in_progress / pending_info → resolved → closed
- [x] Comments thread
- [x] Reopen ticket
- [x] CSV export (client-side)

## Phase 4 — Auth
- [x] Department staff: no PIN
- [x] Manager: PIN login + change in Settings

## Phase 5 — Legacy (optional local)
- [x] Node + SQLite server (`server.js`) for offline dev

---

## Ticket statuses

| Status | Meaning |
|--------|---------|
| `open` | New ticket |
| `in_progress` | Manager working on it |
| `pending_info` | Waiting on department |
| `resolved` | Done on Ops side |
| `closed` | Department confirmed |
| `declined` | Not proceeding |

## Departments

Transport · Facilities · Kitchen · Security · Farms
