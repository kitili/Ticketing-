/**
 * Measure self-healing vs self-improving:
 * 10 runs BEFORE storing fixes, 10 AFTER.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { loop } = require("./loop");
const { remember, clearInstructions } = require("./agent");

const FIXTURES = [
  "SH-01-spoof.json",
  "SH-02-urgent.json",
  "SH-03-low.json",
];

function loadFixtures() {
  const dir = path.join(__dirname, "fixtures");
  return FIXTURES.map((f) =>
    JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
  );
}

function runBatch(label, n, tickets) {
  let retries = 0;
  let escalations = 0;
  let passes = 0;
  const rows = [];
  for (let i = 0; i < n; i++) {
    const ticket = tickets[i % tickets.length];
    // clone so runs are independent
    const t = { ...ticket, id: `${ticket.id}-r${i + 1}` };
    const out = loop(t);
    retries += out.retries;
    if (out.escalated) escalations += 1;
    if (out.ok) passes += 1;
    rows.push({
      run: i + 1,
      ticket_id: t.id,
      ok: out.ok,
      retries: out.retries,
      escalated: out.escalated,
      failure_id: out.check.failure_id,
    });
  }
  return { label, n, passes, retries, escalations, rows };
}

function main() {
  const tickets = loadFixtures();
  const logDir = path.join(__dirname, "logs");
  fs.mkdirSync(logDir, { recursive: true });
  // fresh logs for this measure
  for (const f of ["runs.jsonl", "escalations.jsonl"]) {
    const p = path.join(logDir, f);
    if (fs.existsSync(p)) fs.writeFileSync(p, "");
  }

  // BEFORE — no stored lessons (loop can still heal via feedback within a run)
  clearInstructions();
  const before = runBatch("before", 10, tickets);

  // STORE THE FIXES (self-improving half) — instructions store
  remember(
    "F1_inbound_spoof",
    "Never trust inbound priority; classify only from title+details.",
    "instructions"
  );
  remember(
    "F2_urgent_advance",
    "Urgent tickets: status_action=none forever in auto intake.",
    "instructions"
  );
  remember(
    "F3_bad_ack",
    "Ack must be non-empty, no ETA/PIN/WhatsApp language, notify=false.",
    "instructions"
  );

  // AFTER — same tickets, lessons loaded up front
  const after = runBatch("after", 10, tickets);

  const report = {
    task: "Ops ticket intake (priority + ack + status action)",
    critic: "plain rules (critic.js) — no model call",
    store: "instructions (scripts/self-heal/store/instructions.jsonl)",
    before,
    after,
    delta: {
      retries: after.retries - before.retries,
      escalations: after.escalations - before.escalations,
    },
  };

  const outPath = path.join(__dirname, "logs", "before-after.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");

  const md = [
    "# Before / after — self-heal measure",
    "",
    `| | Runs | Passes | Retries (sum) | Escalations |`,
    `|---|------:|-------:|--------------:|------------:|`,
    `| **Before** (no stored fix) | ${before.n} | ${before.passes} | ${before.retries} | ${before.escalations} |`,
    `| **After** (instructions store) | ${after.n} | ${after.passes} | ${after.retries} | ${after.escalations} |`,
    "",
    `Retries dropped by **${before.retries - after.retries}**; escalations dropped by **${before.escalations - after.escalations}**.`,
    "",
    "Store chosen for all three failures: **instructions** — the agent was never told the rules permanently; feedback healed one run, memory shortens the next.",
    "",
  ];
  fs.writeFileSync(path.join(__dirname, "logs", "before-after.md"), md.join("\n") + "\n");
  console.log(md.join("\n"));
  console.log("Wrote", outPath);
}

main();
