#!/usr/bin/env bash
# SessionStart: re-inject open beads into context (append-only JSONL)
set -euo pipefail
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
STATUS="$ROOT/.beads/status.jsonl"
if [[ ! -f "$STATUS" ]]; then
  exit 0
fi
OPEN=$(python3 - <<PY
import json
from pathlib import Path
p = Path("$STATUS")
open_ids = {}
for line in p.read_text().splitlines():
    line=line.strip()
    if not line: continue
    ev=json.loads(line)
    bid=ev.get("id")
    if not bid: continue
    if ev.get("event") == "open":
        open_ids[bid] = ev
    elif ev.get("event") in ("close", "closed", "resolve", "resolved"):
        open_ids.pop(bid, None)
for bid, ev in open_ids.items():
    print(f"- {bid}: {ev.get('title') or ev.get('summary') or ''}")
PY
)
if [[ -z "$OPEN" ]]; then
  exit 0
fi
# Claude Code session-start: print additionalContext JSON when supported
python3 - <<PY
import json
msg = """Open beads (from .beads/status.jsonl) — continue or close with a resolution:
$OPEN
"""
print(json.dumps({"additionalContext": msg}))
PY
