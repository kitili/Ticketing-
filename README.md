# Silverleaf Ops Ticket Desk

# Ticketing-

Simple internal app: **five operations departments** open tickets with the **Operations Manager**, who responds and tracks progress; departments **close** when resolved.

**Stack:** HTML + CSS + JavaScript · Node.js + Express + SQLite (no frameworks on the frontend).

## Departments

Transport · Facilities · Kitchen · Security · Farms

## Workflow

1. **Open ticket** → status `open`
2. Manager sets **In progress** / **Pending info** / **Resolved** / **Declined**
3. Department **Close ticket** (only after Resolved) → `closed`
4. **Export CSV** by date range (manager)

## Run locally

```bash
cd silverleaf-ops-request-desk
npm install
npm start
```

Open **http://localhost:3847**

## Manager PIN

Only the **Operations Manager** uses a PIN. Departments do **not**.

Default manager PIN (current): **`Ops2026`**

To change it, set a new `MANAGER_PIN` and restart the server, or use the Manager **Settings** tab.

```bash
MANAGER_PIN=your-secret npm start
```

## Project layout

```
OUTLINE.md          ← full build checklist
server.js           ← API
db.js               ← SQLite
data/ops-requests.db
public/
  index.html
  css/styles.css
  js/api.js, ui.js, app.js
```

## Outline

See [OUTLINE.md](./OUTLINE.md) for every process and phase.
