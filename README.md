# Silverleaf Ops Ticket Desk

# Ticketing-

Simple internal **ticket system** for Silverleaf operations: five departments open tickets; the Operations Manager manages them; departments close when resolved.

**Production stack:** Static HTML/CSS/JS + **Supabase** (free DB) + **Netlify** (free hosting).  
**No Node server required** for live deployment.

## Departments

Transport · Facilities · Kitchen · Security · Farms

## Workflow

1. **Open ticket** → `open`
2. Manager: **In progress** / **Pending info** / **Resolved** / **Declined**
3. Department **Close ticket** (after Resolved) → `closed`
4. Manager **Export CSV**

## Manager PIN

- Departments: **no PIN**
- Manager default PIN (after running schema): **`Ops2026`**
- Change in Manager → **Settings**

## Deploy (free)

See **[DEPLOY.md](./DEPLOY.md)** — Supabase + Netlify in ~10 minutes.

## Local dev

```bash
cp public/js/config.example.js public/js/config.js
# add Supabase URL + anon key to config.js
cd public && python3 -m http.server 8080
```

## Project layout

```
public/           ← frontend (Netlify publish dir)
supabase/schema.sql
scripts/write-config.js
netlify.toml
DEPLOY.md
```

Legacy Node/SQLite: `server.js`, `db.js` (optional local use).
