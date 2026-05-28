/**
 * Reset manager PIN hash in SQLite settings.
 *
 * Usage:
 *   node scripts/reset-manager-pin.js Ops2026
 */

const { db } = require("../db");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const pin = process.argv[2];
if (!pin) die("Provide a PIN. Example: node scripts/reset-manager-pin.js Ops2026");
if (String(pin).length < 4) die("PIN too short.");

const crypto = require("crypto");
const saltRow = db.prepare(`SELECT value FROM settings WHERE key='pin_salt'`).get();
if (!saltRow) die("Missing pin_salt in settings table.");

const salt = saltRow.value;
const hash = crypto.pbkdf2Sync(String(pin), salt, 120000, 32, "sha256").toString("hex");

db.prepare(
  `INSERT INTO settings(key, value) VALUES ('manager_pin_hash', ?)
   ON CONFLICT(key) DO UPDATE SET value=excluded.value`
).run(hash);

console.log("OK: manager PIN updated.");

