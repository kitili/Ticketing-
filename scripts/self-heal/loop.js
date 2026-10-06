/**
 * Self-healing loop: act → critic → retry with reason → cap → escalate.
 * Model/agent code path is unchanged; the system around it retries.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { run: agentRun } = require("./agent");
const { critic } = require("./critic");

const MAX_TRIES = 3;
const LOG_DIR = path.join(__dirname, "logs");

function escalateToHuman(ticket, result, check, trail) {
  const escalation = {
    ts: new Date().toISOString(),
    ticket_id: ticket.id,
    final_reason: check.reason,
    failure_id: check.failure_id,
    trail,
    needs_human: true,
  };
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(
    path.join(LOG_DIR, "escalations.jsonl"),
    JSON.stringify(escalation) + "\n"
  );
  return escalation;
}

/**
 * @param {object} ticket
 * @param {{ maxTries?: number }} opts
 */
function loop(ticket, opts = {}) {
  const maxTries = opts.maxTries || MAX_TRIES;
  let tries = 0;
  // Accumulate reasons so a fix for F1 is not forgotten when the next try hits F3.
  const feedbackParts = [];
  const trail = [];

  let result = agentRun(ticket, null);
  let check = critic({ ticket, result });
  trail.push({ try: tries, result, check });

  while (!check.ok && tries < maxTries - 1) {
    tries += 1;
    feedbackParts.push(check.reason); // reason goes back in — not bare "try again"
    const feedback = feedbackParts.join("\n");
    result = agentRun(ticket, feedback);
    check = critic({ ticket, result });
    trail.push({ try: tries, result, check, feedback });
  }

  const out = {
    ticket_id: ticket.id,
    ok: check.ok,
    retries: tries,
    result,
    check,
    trail,
    escalated: false,
  };

  if (!check.ok) {
    out.escalated = true;
    out.escalation = escalateToHuman(ticket, result, check, trail);
  }

  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(path.join(LOG_DIR, "runs.jsonl"), JSON.stringify(out) + "\n");
  return out;
}

module.exports = { loop, MAX_TRIES };

if (require.main === module) {
  const ticketPath = process.argv[2];
  if (!ticketPath) {
    console.error("Usage: node loop.js <ticket.json>");
    process.exit(2);
  }
  const ticket = JSON.parse(fs.readFileSync(ticketPath, "utf8"));
  const out = loop(ticket);
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.ok ? 0 : 1);
}
