/**
 * Generate PBKDF2 hash for manager PIN (matches browser + legacy Node).
 * Usage: node scripts/hash-pin.js Ops2026 [salt]
 */
const crypto = require("crypto");
const pin = process.argv[2];
const salt = process.argv[3] || "silverleaf_ops_salt_v1";
if (!pin) {
  console.error("Usage: node scripts/hash-pin.js <PIN> [salt]");
  process.exit(1);
}
const hash = crypto.pbkdf2Sync(pin, salt, 120000, 32, "sha256").toString("hex");
console.log(JSON.stringify({ salt, hash }, null, 2));
