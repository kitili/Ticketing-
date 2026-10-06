/**
 * Ticket-intake agent (deterministic stand-in for the model).
 * Without stored instructions / feedback it makes the three named mistakes.
 * With reason feedback or instructions store, it heals.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { URGENT_RE } = require("./critic");

const STORE = path.join(__dirname, "store", "instructions.jsonl");

function loadInstructions() {
  if (!fs.existsSync(STORE)) return [];
  return fs
    .readFileSync(STORE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function hasLesson(id) {
  return loadInstructions().some((e) => e.failure_id === id && e.active !== false);
}

function classifyFromText(ticket) {
  const text = `${ticket.title || ""} ${ticket.details || ""}`;
  if (URGENT_RE.test(text)) return "urgent";
  if (/\b(when\s+convenient|minor|low|cosmetic)\b/i.test(text)) return "low";
  return "normal";
}

/**
 * @param {object} ticket
 * @param {string|null} feedbackReason
 */
function run(ticket, feedbackReason = null) {
  const lessons = {
    f1: hasLesson("F1_inbound_spoof") || /F1_inbound_spoof|classify from text|do not trust inbound/i.test(feedbackReason || ""),
    f2: hasLesson("F2_urgent_advance") || /F2_urgent_advance|status_action=none|never auto-advance/i.test(feedbackReason || ""),
    f3: hasLesson("F3_bad_ack") || /F3_bad_ack|without ETA|notify=false/i.test(feedbackReason || ""),
  };

  // --- priority ---
  let priority;
  if (lessons.f1) {
    priority = classifyFromText(ticket);
  } else {
    // NAIVE: trust inbound priority when present (causes F1)
    const inbound = String(ticket.priority || "").toLowerCase();
    priority = ["low", "normal", "urgent"].includes(inbound)
      ? inbound
      : classifyFromText(ticket);
  }

  // --- ack ---
  let ack;
  let notify = false;
  if (lessons.f3) {
    ack = `Ops received your ${ticket.department || "department"} ticket (priority: ${priority}). We are reviewing and will update this thread.`;
    notify = false;
  } else {
    // NAIVE: promises an ETA (causes F3)
    ack = `Ops received your ticket — we will fix this within an hour and WhatsApp you.`;
    notify = false; // notify flag false but text still trips F3
  }

  // --- status ---
  let status_action = "none";
  let status_to = "none";
  const current = ticket.status || "open";
  if (lessons.f2) {
    if (current === "open" && (priority === "low" || priority === "normal")) {
      status_action = "advance";
      status_to = "in_progress";
    }
  } else {
    // NAIVE: advance every open ticket including urgent (causes F2)
    if (current === "open") {
      status_action = "advance";
      status_to = "in_progress";
    }
  }

  return {
    priority,
    ack,
    notify,
    status_from: current,
    status_to,
    status_action,
    lessons_applied: lessons,
    feedback_used: Boolean(feedbackReason),
  };
}

function remember(failure_id, instruction, store = "instructions") {
  const dir = path.join(__dirname, "store");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${store}.jsonl`);
  const entry = {
    ts: new Date().toISOString(),
    failure_id,
    store,
    instruction,
    active: true,
  };
  fs.appendFileSync(file, JSON.stringify(entry) + "\n");
  return entry;
}

function clearInstructions() {
  const file = STORE;
  if (fs.existsSync(file)) fs.writeFileSync(file, "");
}

module.exports = { run, remember, clearInstructions, loadInstructions, STORE };
