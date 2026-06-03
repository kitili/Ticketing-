# Silverleaf Ops Ticket Desk

# Ticketing-

Simple internal **ticket system** for Silverleaf operations: five departments open tickets; the Operations Manager manages them; departments close when resolved.

**Production stack:** Static HTML/CSS/JS + **Supabase** (free DB) + **Netlify** (free hosting).  
**No Node server required** for live deployment.

**Offline:** PWA + local queue — open tickets and manager actions without network; sync when back online.  
**Notifications:** Email (Resend) and optional WhatsApp (Twilio) via Supabase Edge Function — see [NOTIFICATIONS.md](./NOTIFICATIONS.md).

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
Set up alerts: **[NOTIFICATIONS.md](./NOTIFICATIONS.md)**.

## Offline use

1. Open the site **once while online** (installs cache + manager PIN for offline login).
2. On poor network: submit tickets, add comments, change status — changes show **pending sync**.
3. When online again, tap **Sync now** or wait for automatic sync.
4. Add to home screen (phone) for quickest access — uses `manifest.webmanifest`.

## Local dev

```bash
cp public/js/config.example.js public/js/config.js
# add Supabase URL + anon key to config.js
cd public && python3 -m http.server 8080
```

## Project layout

```
public/           ← frontend (Netlify publish dir)
public/sw.js      ← offline app shell
public/js/offline-store.js, sync.js, api-remote.js
supabase/schema.sql
supabase/functions/notify-new-request/
scripts/write-config.js
netlify.toml
DEPLOY.md
NOTIFICATIONS.md
```

Legacy Node/SQLite: `server.js`, `db.js` (optional local use).
