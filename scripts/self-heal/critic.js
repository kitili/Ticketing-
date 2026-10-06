/**
 * Plain-rule critic for ticket-intake output.
 * Returns a REASON string on failure (never just "failed").
 * Flavour: plain rules only — free, instant; no model call.
 */
"use strict";

const URGENT_RE =
  /\b(urgent|emergency|injury|fire|flood|outage|gas\s*leak|no\s*water)\b/i;
const FORBIDDEN_ACK =
  /\b(within\s+an?\s+hour|by\s+\d|whatsapp|email\s+you|pin|password)\b/i;
const TERMINAL = new Set(["resolved", "declined", "closed"]);

function textOf(ticket) {
  return `${ticket.title || ""} ${ticket.details || ""}`;
}

/**
 * @param {{ ticket: object, result: object }} input
 * @returns {{ ok: boolean, reason: string|null, failure_id: string|null }}
 */
function critic({ ticket, result }) {
  const text = textOf(ticket);
  const priority = result.priority;
  const action = result.status_action;
  const to = result.status_to;
  const ack = result.ack || "";
  const notify = result.notify === true;

  // F1 — spoofed / invented urgency
  if (priority === "urgent" && !URGENT_RE.test(text)) {
    return {
      ok: false,
      failure_id: "F1_inbound_spoof",
      reason:
        "F1_inbound_spoof: priority is urgent but title+details lack urgent/emergency/outage language — do not trust inbound priority; classify from text only.",
    };
  }

  // F2 — advancing an urgent ticket
  if (
    priority === "urgent" &&
    (action === "advance" ||
      to === "in_progress" ||
      TERMINAL.has(to))
  ) {
    return {
      ok: false,
      failure_id: "F2_urgent_advance",
      reason:
        "F2_urgent_advance: urgent tickets must keep status_action=none (never auto-advance or resolve) — escalate urgency to a human instead.",
    };
  }

  // F3 — bad acknowledgement / notify / empty
  if (!String(ack).trim()) {
    return {
      ok: false,
      failure_id: "F3_bad_ack",
      reason:
        "F3_bad_ack: acknowledgement is empty — draft one short ack with no ETA, PIN, or notify language.",
    };
  }
  if (FORBIDDEN_ACK.test(ack) || notify) {
    return {
      ok: false,
      failure_id: "F3_bad_ack",
      reason:
        "F3_bad_ack: ack promises a time, mentions PIN/password, or sets notify=true — rewrite ack without ETA/PIN/notify and keep notify=false.",
    };
  }
  if (TERMINAL.has(to)) {
    return {
      ok: false,
      failure_id: "F2_urgent_advance",
      reason:
        "F2_urgent_advance: terminal status_to is not allowed in auto intake — only open→in_progress for low/normal, else none.",
    };
  }

  return { ok: true, reason: null, failure_id: null };
}

module.exports = { critic, URGENT_RE, FORBIDDEN_ACK };
