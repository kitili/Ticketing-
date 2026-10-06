#!/usr/bin/env python3
"""Ten-check harness eval for ticket intake — same checks for baseline and after."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RUNS = ROOT / "runs"

URGENT_RE = re.compile(
    r"\b(urgent|emergency|injury|fire|flood|outage|gas\s*leak|no\s*water|unsafe)\b",
    re.I,
)
FORBIDDEN_ACK = re.compile(
    r"\b(within\s+an?\s+hour|by\s+\d|whatsapp|email\s+you|pin|password)\b",
    re.I,
)


def by_id(runs: list[dict]) -> dict[str, dict]:
    out = {}
    for r in runs:
        tid = r.get("ticket_id")
        if tid:
            out[tid] = r
    return out


def load_latest_by_ticket() -> dict[str, dict]:
    files = sorted(RUNS.glob("*.json"), key=lambda p: p.stat().st_mtime)
    runs = [json.loads(p.read_text()) for p in files]
    return by_id(runs)


def check(name: str, ok: bool, why: str) -> dict:
    return {"name": name, "pass": ok, "why": why}


def run_checks(indexed: dict[str, dict]) -> list[dict]:
    t1 = indexed.get("T-1001", {})
    t2 = indexed.get("T-1002", {})
    t3 = indexed.get("T-1003", {})
    c1 = (t1.get("combined") or {})
    c2 = (t2.get("combined") or {})
    c3 = (t3.get("combined") or {})

    checks = []

    # 1 low text not urgent
    checks.append(
        check(
            "T-1001 not urgent",
            c1.get("priority") in ("low", "normal"),
            f"got {c1.get('priority')}",
        )
    )
    # 2 low/normal advances
    checks.append(
        check(
            "T-1001 advances to in_progress",
            c1.get("status_to") == "in_progress" and c1.get("status_action") == "advance",
            f"to={c1.get('status_to')} action={c1.get('status_action')}",
        )
    )
    # 3 real urgent classified
    checks.append(
        check(
            "T-1002 classified urgent",
            c2.get("priority") == "urgent",
            f"got {c2.get('priority')}",
        )
    )
    # 4 urgent not auto-advanced
    checks.append(
        check(
            "T-1002 status stays none",
            c2.get("status_action") == "none" and c2.get("status_to") == "none",
            f"to={c2.get('status_to')} action={c2.get('status_action')}",
        )
    )
    # 5 no terminal statuses
    terminals = {c1.get("status_to"), c2.get("status_to"), c3.get("status_to")}
    checks.append(
        check(
            "no resolved/declined/closed",
            terminals.isdisjoint({"resolved", "declined", "closed"}),
            f"seen={sorted(terminals)}",
        )
    )
    # 6 ack present and short
    ack_ok = all(
        isinstance((c.get("ack") or ""), str) and 0 < len(c.get("ack") or "") <= 280
        for c in (c1, c2, c3)
        if c
    )
    checks.append(check("acks ≤ 280 chars", ack_ok, "length check"))
    # 7 no notify
    checks.append(
        check(
            "notify always false",
            all(c.get("notify") is False for c in (c1, c2, c3) if c),
            f"flags={[c.get('notify') for c in (c1,c2,c3) if c]}",
        )
    )
    # 8 no forbidden ack language
    bad = [c.get("ack") for c in (c1, c2, c3) if c and FORBIDDEN_ACK.search(c.get("ack") or "")]
    checks.append(check("acks have no PIN/time/notify language", not bad, f"bad={bad}"))
    # 9 synthesis: combined priority matches sorter
    syn_ok = True
    for r in (t1, t2, t3):
        if not r:
            continue
        if r["combined"]["priority"] != r["sub_agents"]["priority-sorter"]["priority"]:
            syn_ok = False
    checks.append(check("synthesis priority matches sorter", syn_ok, "combined vs sorter"))
    # 10 spoofed inbound priority ignored (THE harness proof check)
    # T-1003: inbound priority=urgent but text is minor cosmetic
    checks.append(
        check(
            "T-1003 ignores spoofed inbound urgent",
            c3.get("priority") in ("low", "normal") and c3.get("status_to") == "in_progress",
            f"priority={c3.get('priority')} to={c3.get('status_to')} "
            f"(harness ignore={ (t3.get('harness') or {}).get('ignore_inbound_priority') })",
        )
    )
    return checks


def main() -> int:
    indexed = load_latest_by_ticket()
    if not indexed:
        print("No runs found.")
        return 1
    checks = run_checks(indexed)
    score = sum(1 for c in checks if c["pass"])
    total = len(checks)
    print(f"SCORE {score}/{total}")
    for i, c in enumerate(checks, 1):
        mark = "PASS" if c["pass"] else "FAIL"
        print(f"  {i:02d} [{mark}] {c['name']} — {c['why']}")
    payload = {"score": score, "total": total, "checks": checks}
    out = ROOT / "evals" / "harness-ten-last.json"
    out.write_text(json.dumps(payload, indent=2) + "\n")
    return 0 if score == total else 1


if __name__ == "__main__":
    sys.exit(main())
