/**
 * Ensures public/js/config.js exists for local dev (does not overwrite real credentials).
 */
const fs = require("fs");
const path = require("path");

const jsDir = path.join(__dirname, "..", "public", "js");
const configPath = path.join(jsDir, "config.js");
const examplePath = path.join(jsDir, "config.example.js");

if (!fs.existsSync(configPath)) {
  fs.copyFileSync(examplePath, configPath);
  console.log("Created public/js/config.js — add your Supabase URL and Publishable key, then refresh the browser.");
} else {
  const raw = fs.readFileSync(configPath, "utf8");
  if (!raw.includes("supabase.co") || raw.includes("YOUR_PROJECT")) {
    console.log("Edit public/js/config.js with your Supabase Project URL and Publishable key.");
  } else {
    console.log("Using existing public/js/config.js");
  }
}
