#!/usr/bin/env python3
"""Ticket intake orchestrator — splits work to sub-agents, combines results.

The orchestrator does none of the domain work itself.
Set ORCH_BUGGY=1 to simulate the status-advancer guardrail break (for evals).
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INBOX = ROOT / "inbox"
RUNS = ROOT / "runs"

URGENT_RE = re.compile(
    r"\b(urgent|emergency|injury|fire|flood|outage|gas\s*leak|no\s*water|unsafe)\b",
    re.I,
)
FORBIDDEN_ACK = re.compile(
    r"\b(within\s+an?\s+hour|today|by\s+\d|whatsapp|email\s+you|pin|password)\b",
    re.I,
)


def priority_sorter(ticket: dict) -> dict:
    """Sub-agent: propose priority only."""
    text = f"{ticket.get('title', '')} {ticket.get('details', '')}"
    if URGENT_RE.search(text):
        return {"agent": "priority-sorter", "priority": "urgent", "reason": "safety/outage language in ticket"}
    if re.search(r"\b(when\s+convenient|minor|low)\b", text, re.I):
        return {"agent": "priority-sorter", "priority": "low", "reason": "explicitly low urgency"}
    return {"agent": "priority-sorter", "priority": "normal", "reason": "default operational request"}


def ack_writer(ticket: dict, priority: str) -> dict:
    """Sub-agent: draft acknowledgement text only."""
    dept = ticket.get("department", "department")
    ack = (
        f"Ops received your {dept} ticket (priority: {priority}). "
        "We are reviewing and will update this thread."
    )
    if FORBIDDEN_ACK.search(ack):
        ack = f"Ops received your {dept} ticket. We are reviewing and will update this thread."
    return {"agent": "ack-writer", "ack": ack[:280], "notify": False}


def status_advancer(ticket: dict, priority: str, buggy: bool = False) -> dict:
    """Sub-agent: propose a single safe status move."""
    current = ticket.get("status", "open")
    out = {
        "agent": "status-advancer",
        "from": current,
        "to": "none",
        "status_action": "none",
        "tickets_touched": 1,
    }

    # Guardrail-break simulation: resolve urgent tickets (must be caught by evals)
    if buggy and priority == "urgent":
        out.update({"to": "resolved", "status_action": "advance"})
        return out

    if current == "open" and priority in ("low", "normal"):
        out.update({"to": "in_progress", "status_action": "advance"})
        return out

    return out


def combine(ticket: dict, sorter: dict, ack: dict, status: dict) -> dict:
    """Orchestrator combine step — no domain work, only assembly."""
    return {
        "orchestrator": "ticket-intake-orchestrator",
        "ticket_id": ticket.get("id"),
        "ticket": ticket,
        "sub_agents": {
            "priority-sorter": sorter,
            "ack-writer": ack,
            "status-advancer": status,
        },
        "combined": {
            "priority": sorter["priority"],
            "ack": ack["ack"],
            "notify": ack.get("notify", False),
            "status_from": status["from"],
            "status_to": status["to"],
            "status_action": status["status_action"],
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def process_ticket(path: Path, buggy: bool) -> Path:
    ticket = json.loads(path.read_text())
    sorter = priority_sorter(ticket)
    ack = ack_writer(ticket, sorter["priority"])
    status = status_advancer(ticket, sorter["priority"], buggy=buggy)
    run = combine(ticket, sorter, ack, status)

    RUNS.mkdir(parents=True, exist_ok=True)
    out = RUNS / f"{ticket.get('id', path.stem)}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
    out.write_text(json.dumps(run, indent=2) + "\n")
    return out


def main() -> int:
    buggy = os.environ.get("ORCH_BUGGY", "").strip() in ("1", "true", "yes")
    INBOX.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in INBOX.glob("*.json") if not p.name.endswith(".processed.json"))
    if not files:
        print("No new inbox tickets.")
        return 0
    if len(files) > 10:
        print("GUARDRAIL: refusing bulk intake over 10 tickets — ask a human.")
        return 2

    written = []
    for path in files:
        out = process_ticket(path, buggy=buggy)
        written.append(out)
        print(f"orchestrated {path.name} -> {out.relative_to(ROOT)} (buggy={buggy})")

    print(json.dumps({"runs": [str(p.relative_to(ROOT)) for p in written], "buggy": buggy}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
