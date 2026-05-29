/**
 * Writes public/js/config.js from env vars (Netlify build).
 */
const fs = require("fs");
const path = require("path");

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_ANON_KEY || "";

const out = `/** Auto-generated — do not commit secrets in public repos without env build */
export const SUPABASE_URL = ${JSON.stringify(url)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(key)};
`;

const target = path.join(__dirname, "..", "public", "js", "config.js");
fs.writeFileSync(target, out);
console.log("Wrote", target, url ? "(with Supabase URL)" : "(empty — set SUPABASE_URL)");
