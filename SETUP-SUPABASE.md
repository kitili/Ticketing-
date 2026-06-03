# Fix: “Supabase is not connected”

The app needs two values from Supabase. Without them, every page shows a red error.

## Get your two values (Supabase)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → project **Ticketing-** (or your ops desk project).
2. **Settings** (gear) → **General** → copy **Project URL**  
   Example: `https://abcdefghijk.supabase.co`  
   **Do not** add `/rest/v1/` — that breaks login and the manager PIN.
3. **Settings** → **API Keys** → copy the **Publishable** key (starts with `eyJ` or `sb_publishable_`)  
   Do **not** use the **Secret** key.

4. **SQL Editor** → paste all of `supabase/schema.sql` → **Run** (once).

---

## A) Testing on your computer (localhost)

Edit **`public/js/config.js`**:

```javascript
export const SUPABASE_URL = "https://YOUR-REAL-PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "paste-publishable-key-here";
```

Save, then open **http://localhost:8080** and hard-refresh (**Ctrl+Shift+R**).

Run the server:

```bash
npm run local
```

---

## B) Live site on Netlify

Saving variables alone is **not** enough — you must **redeploy**.

1. [app.netlify.com](https://app.netlify.com) → your site → **Site configuration** → **Environment variables**
2. Add **exactly** these names (copy-paste names, no typos):

| Variable name | Value |
|---------------|--------|
| `SUPABASE_URL` | Your Project URL |
| `SUPABASE_ANON_KEY` | Your **Publishable** key |

3. **Deploys** → **Trigger deploy** → **Deploy site** (wait until status is **Published**).
4. Check: open `https://YOUR-SITE.netlify.app/js/env.js`  
   You must see your real URL inside the file, **not** `""`.

5. Open the site home page — the red error should be gone.

### Common mistakes

| Mistake | Fix |
|---------|-----|
| Used Secret key instead of Publishable | Use Publishable key only |
| Variable named `SUPABASE_KEY` only | Rename or duplicate as `SUPABASE_ANON_KEY` |
| Saved env vars but did not redeploy | Trigger deploy again |
| Old browser cache | Hard refresh or private window |

---

## Still stuck?

Tell us:
- Are you on **localhost** or **Netlify**?
- What do you see at `https://YOUR-SITE.netlify.app/js/env.js` (first line with SUPABASE_URL only — **do not** send the full key)?
