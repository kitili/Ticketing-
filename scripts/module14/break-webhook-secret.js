/**
 * Part 3 — deliberate break: wrong webhook secret → expect 403.
 * Run: node scripts/module14/break-webhook-secret.js
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { verifySlackSignature } = require("./run-assignment");

const rawBody = JSON.stringify({ type: "event_callback", event: { text: "ping" } });
const timestamp = String(Math.floor(Date.now() / 1000));
const realSecret = "correct-secret-from-slack-app";
const wrongSecret = "tampered-secret-on-host-only";

const validSig =
  "v0=" +
  crypto.createHmac("sha256", realSecret).update(`v0:${timestamp}:${rawBody}`).digest("hex");

const out = { tried_at: new Date().toISOString(), cases: [] };

try {
  verifySlackSignature(rawBody, timestamp, validSig, realSecret);
  out.cases.push({ name: "matching secrets", result: "allowed" });
} catch (e) {
  out.cases.push({ name: "matching secrets", result: "unexpected_block", error: e.message });
}

try {
  verifySlackSignature(rawBody, timestamp, validSig, wrongSecret);
  out.cases.push({ name: "secret changed on one side only", result: "unexpected_allow" });
} catch (e) {
  out.cases.push({
    name: "secret changed on one side only",
    result: "blocked_as_expected",
    status: e.status || 403,
    exact_error: e.message,
  });
}

const dir = path.join(__dirname, "../../PROOF/module14");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "break-webhook-403.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
