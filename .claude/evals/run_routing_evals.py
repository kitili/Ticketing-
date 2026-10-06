#!/usr/bin/env python3
"""Routing report card: hop count + wrong-route rate for L1→L2/L3 docs."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TASKS = Path(__file__).resolve().parent / "routing-tasks.json"
OUT = Path(__file__).resolve().parent / "results.json"

# Rough local cost model (no API call): $0.003 / 1k chars read
USD_PER_1K_CHARS = 0.003


def parse_nav_table(claude_md: str) -> dict[str, str]:
    """Map need keywords → path from the Navigate table."""
    routes = {}
    for line in claude_md.splitlines():
        if "|" not in line or "Go to" in line or "----" in line or "Need" in line:
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) != 2:
            continue
        need, go = parts
        # extract backtick paths
        paths = re.findall(r"`([^`]+)`", go)
        if paths:
            routes[need.lower()] = paths[0]
    return routes


def route(question: str, kind: str, claude_md: str) -> list[str]:
    """Simulate disciplined routing: always L1, then at most one more hop."""
    hops = ["CLAUDE.md"]
    q = question.lower()
    nav = parse_nav_table(claude_md)

    # Skill / drain → ticket-intake skill (check before bare "inbox")
    if any(w in q for w in ("skill", "drain", "/ticket-intake", "end to end")):
        hops.append(".claude/skills/ticket-intake/SKILL.md")
        return hops

    # Explicit / negative autonomy questions → L3
    if any(w in q for w in ("autonomy", "dial", "whatsapp", "notify", "stop-and-ask")):
        hops.append("docs/L3-autonomy.md")
        return hops

    # Inbox / where tickets land → L2
    if any(w in q for w in ("new ticket", "where do new", "tickets land", "inbox/")):
        hops.append("docs/L2-ops-desk.md")
        return hops
    if "inbox" in q and "skill" not in q:
        hops.append("docs/L2-ops-desk.md")
        return hops

    # Fallback: first nav hit by keyword overlap
    for need, path in nav.items():
        if any(tok in q for tok in need.split() if len(tok) > 3):
            hops.append(path)
            return hops

    return hops


def main() -> int:
    claude_md = (ROOT / "CLAUDE.md").read_text()
    tasks = json.loads(TASKS.read_text())["tasks"]
    results = []
    chars_read = 0
    wrong = 0
    hop_sum = 0

    for t in tasks:
        loaded = route(t["question"], t["kind"], claude_md)
        hop_sum += len(loaded)
        # chars cost: only count files that exist
        for rel in loaded:
            p = ROOT / rel
            if p.exists():
                chars_read += len(p.read_text())

        missing = [d for d in t["should_load"] if d not in loaded]
        # wrong-route: loaded something forbidden, or missed required destination
        forbidden_hit = [d for d in t.get("should_not_load", []) if d in loaded]
        over_hops = len(loaded) > t.get("max_hops", 2)
        # For routing quality: must include final should_load doc (last required)
        target = t["should_load"][-1]
        missed_target = target not in loaded
        is_wrong = bool(forbidden_hit or missed_target or over_hops or missing)
        if is_wrong:
            wrong += 1

        results.append(
            {
                "id": t["id"],
                "kind": t["kind"],
                "hops": len(loaded),
                "loaded": loaded,
                "missing": missing,
                "forbidden_hit": forbidden_hit,
                "pass": not is_wrong,
            }
        )

    n = len(tasks)
    avg_hops = round(hop_sum / n, 2) if n else 0
    wrong_rate = round(100.0 * wrong / n, 2) if n else 0
    cost_usd = round((chars_read / 1000.0) * USD_PER_1K_CHARS, 6)

    summary = {
        "average_hops": avg_hops,
        "wrong_route_rate_pct": wrong_rate,
        "wrong_routes": wrong,
        "tasks": n,
        "cost_usd": cost_usd,
        "chars_read": chars_read,
        "targets": {"max_avg_hops": 2, "max_wrong_route_pct": 5},
        "pass": avg_hops <= 2 and wrong_rate < 5,
        "results": results,
    }
    OUT.write_text(json.dumps(summary, indent=2) + "\n")

    md = [
        "# Routing eval results",
        "",
        f"**Average hops:** {avg_hops} (target ≤ 2)",
        f"**Wrong-route rate:** {wrong_rate}% ({wrong}/{n}) (target < 5%)",
        f"**cost_usd:** {cost_usd}",
        f"**Pass:** {summary['pass']}",
        "",
    ]
    for r in results:
        mark = "PASS" if r["pass"] else "FAIL"
        md.append(f"- `{r['id']}` ({r['kind']}) — **{mark}** — hops={r['hops']} loaded={r['loaded']}")
    (Path(__file__).resolve().parent / "results.md").write_text("\n".join(md) + "\n")

    print("\n".join(md))
    return 0 if summary["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
