/**
 * Writes public/js/env.js from env vars (Netlify build).
 * Only overwrites config.js when env vars are set or building on Netlify.
 */
const fs = require("fs");
const path = require("path");

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
const key = (
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();
const isNetlify = Boolean(process.env.NETLIFY);
const hasEnv = Boolean(url && key);

const jsDir = path.join(__dirname, "..", "public", "js");
const configPath = path.join(jsDir, "config.js");
const envPath = path.join(jsDir, "env.js");

const configOut = `/** Auto-generated at build — do not edit */
export const SUPABASE_URL = ${JSON.stringify(url)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(key)};
`;

const envOut = `/** Auto-generated at build — local dev uses config.js when these are empty */
window.__SL_ENV__ = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(key)},
};
`;

if (hasEnv || isNetlify) {
  fs.writeFileSync(configPath, configOut);
  console.log("Wrote public/js/config.js", url ? `(Supabase URL: ${url})` : "");
} else {
  const exists = fs.existsSync(configPath);
  const raw = exists ? fs.readFileSync(configPath, "utf8") : "";
  const looksConfigured =
    exists &&
    raw.includes("supabase.co") &&
    !raw.includes('""') &&
    !raw.includes("YOUR_PROJECT");
  if (!looksConfigured) {
    console.log(
      "Skipped config.js (no env vars). For local dev: cp public/js/config.example.js public/js/config.js and add your Supabase URL + key."
    );
  } else {
    console.log("Kept existing public/js/config.js (local credentials preserved).");
  }
}

fs.writeFileSync(envPath, envOut);

if (isNetlify && !hasEnv) {
  console.error(
    "\nNetlify build failed: set SUPABASE_URL and SUPABASE_ANON_KEY under Site configuration → Environment variables, then trigger deploy again.\n"
  );
  process.exit(1);
}

console.log("Wrote public/js/env.js", hasEnv ? "(with credentials)" : "(empty — use config.js locally)");
