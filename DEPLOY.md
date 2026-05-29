# Deploy: Supabase + Netlify (free)

## 1) Create Supabase project (free)
1. Go to [supabase.com](https://supabase.com) → New project (free tier).
2. Open **SQL Editor** → paste and run **`supabase/schema.sql`**.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

Default manager PIN after schema: **`Ops2026`** (change in app Settings).

---

## 2) Deploy frontend on Netlify (free)
1. Push this repo to GitHub: `https://github.com/kitili/Ticketing-`
2. Netlify → **Add new site** → **Import from Git** → select repo.
3. Build settings (auto from `netlify.toml`):
   - **Publish directory:** `public`
   - **Build command:** `node scripts/write-config.js`
4. **Site settings → Environment variables:**
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_ANON_KEY` = your anon key
5. **Deploy site** → Netlify gives you a link like `https://something.netlify.app`

---

## 3) Custom domain (optional)
Netlify → **Domain management** → add `ops.silverleafschools.co.tz`  
Add the DNS record Netlify shows (usually CNAME).

---

## Local dev (optional)
```bash
cp public/js/config.example.js public/js/config.js
# Edit config.js with your Supabase URL + anon key
cd public && python3 -m http.server 8080
```
Open **http://localhost:8080**

(No Node server needed for production.)

---

## Legacy Node server
The old `server.js` + SQLite setup still works locally if you prefer:
```bash
npm install && npm start
```
For production, use **Supabase + Netlify** instead.
