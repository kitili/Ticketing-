# Deploy: Supabase + Netlify (free)

## What goes where (important)

| You have in Supabase | Put in Netlify as | Do NOT use |
|----------------------|-------------------|------------|
| **Project URL** (Settings → General) | `SUPABASE_URL` | Secret key |
| **Publishable key** (Settings → API Keys) | `SUPABASE_ANON_KEY` | Secret key |

Example:
- `SUPABASE_URL` = `https://abcdefgh.supabase.co`
- `SUPABASE_ANON_KEY` = `sb_publishable_Hs5JT0...` (copy full key)

The **Secret key** is only for servers — never put it in Netlify.

---

## 1) Supabase setup

1. [supabase.com](https://supabase.com) → your project **Ticketing-**
2. **SQL Editor** → paste all of **`supabase/schema.sql`** → **Run**
3. **Settings → General** → copy **Project URL**
4. **Settings → API Keys** → copy **Publishable key** (default)

Default manager PIN after schema: **`Ops2026`**

---

## 2) Netlify setup

1. Import GitHub repo: `https://github.com/kitili/Ticketing-`
2. Build settings (from `netlify.toml`):
   - **Base directory:** (leave empty)
   - **Build command:** `node scripts/write-config.js`
   - **Publish directory:** `public`
3. **Site configuration → Environment variables** → add:

| Key | Value |
|-----|--------|
| `SUPABASE_URL` | Your Project URL |
| `SUPABASE_ANON_KEY` | Your **Publishable** key |

4. **Deploys → Trigger deploy → Deploy site** (required after adding env vars — saving variables alone is not enough)

If env vars are missing, the Netlify **build will fail** with a clear error (this is intentional).

---

## 3) Verify deploy worked

Open these in your browser (replace with your Netlify URL):

- `https://YOUR-SITE.netlify.app/js/env.js`

You should see your real Supabase URL inside the file, for example:

```javascript
window.__SL_ENV__ = {
  SUPABASE_URL: "https://abcdefgh.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_...",
};
```

If both values are still `""`, the build did not receive env vars — check spelling (`SUPABASE_ANON_KEY`, not `SUPABASE_KEY`) and redeploy.

---

## 4) Test the app

Open your Netlify URL. You should see:
- No red “Supabase is not connected” banner
- Department dropdown filled (Transport, Facilities, …)
- Department staff: no PIN
- Manager PIN: **Ops2026**

If you see “Cannot reach Supabase”, run **`supabase/schema.sql`** in the Supabase SQL Editor.

---

## 5) Offline & install on phones

- First visit must be **online** so the app caches files and (for manager) stores the PIN hash locally.
- Yellow/blue bar at top shows **Offline** or **pending sync** counts.
- **Sync now** appears when there are queued changes and you are online.
- On Android/iPhone: browser menu → **Add to Home screen** / **Install app**.

---

## 6) Notifications (after deploy)

See **[NOTIFICATIONS.md](./NOTIFICATIONS.md)** — deploy `notify-new-request` Edge Function and add a Database Webhook on `requests` INSERT.

Set `ops_manager_email` / `ops_manager_phone` in the `settings` table.

---

## Local dev

```bash
cp public/js/config.example.js public/js/config.js
# Edit config.js with your Supabase URL + Publishable key
cd public && python3 -m http.server 8080
```

Open **http://localhost:8080**

Offline testing: use DevTools → Network → **Offline**, or install via `http://localhost:8080` after one online load.
