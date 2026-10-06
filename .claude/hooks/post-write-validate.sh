#!/usr/bin/env bash
# PostToolUse: validate CLAUDE.md still ≤150 after edit; silent on success
set -euo pipefail
INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
d=json.load(sys.stdin)
ti=d.get('tool_input') or d.get('input') or {}
print(ti.get('file_path') or ti.get('path') or '')
" 2>/dev/null || echo "")

base=$(basename "$FILE" 2>/dev/null || echo "")
if [[ "$base" != "CLAUDE.md" ]]; then
  exit 0
fi
if [[ ! -f "$FILE" ]]; then
  exit 0
fi
lines=$(wc -l < "$FILE" | tr -d ' ')
if [[ "$lines" -gt 150 ]]; then
  echo "VALIDATE FAIL: CLAUDE.md is ${lines} lines (max 150). Trim L1 and move detail to L2/L3." >&2
  exit 2
fi
exit 0
