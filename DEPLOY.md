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

4. **Deploys → Trigger deploy → Deploy site** (required after adding env vars)

---

## 3) Test

Open your Netlify URL. You should see:
- Department dropdown filled (Transport, Facilities, …)
- Department staff: no PIN
- Manager PIN: **Ops2026**

If the dropdown is empty or the form is frozen, Supabase env vars are missing — redeploy after fixing step 2.

---

## Local dev

```bash
cp public/js/config.example.js public/js/config.js
# Edit config.js with your Supabase URL + Publishable key
cd public && python3 -m http.server 8080
```

Open **http://localhost:8080**
