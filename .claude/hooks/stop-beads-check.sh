#!/usr/bin/env bash
# Stop: remind to close beads / note failures (loud only if open beads remain)
set -euo pipefail
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
STATUS="$ROOT/.beads/status.jsonl"
[[ -f "$STATUS" ]] || exit 0
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
print(len(open_ids))
for bid, ev in open_ids.items():
    print(f"{bid}: {ev.get('title','')}")
PY
)
count=$(echo "$OPEN" | head -1)
if [[ "$count" == "0" ]]; then
  exit 0
fi
echo "STOP CHECK: $count open bead(s) remain — close with resolution in .beads/status.jsonl:" >&2
echo "$OPEN" | tail -n +2 >&2
# advisory only — do not block stop
exit 0
