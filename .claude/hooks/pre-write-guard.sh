#!/usr/bin/env bash
# PreToolUse Write|Edit: block CLAUDE.md over 150 lines; block writing .env / config.js
set -euo pipefail
INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
d=json.load(sys.stdin)
ti=d.get('tool_input') or d.get('input') or {}
print(ti.get('file_path') or ti.get('path') or '')
" 2>/dev/null || echo "")
CONTENT=$(echo "$INPUT" | python3 -c "
import sys, json
d=json.load(sys.stdin)
ti=d.get('tool_input') or d.get('input') or {}
print(ti.get('content') or ti.get('new_string') or '')
" 2>/dev/null || echo "")

base=$(basename "$FILE" 2>/dev/null || echo "")

if [[ "$base" == ".env" ]] || [[ "$FILE" == *"/public/js/config.js" ]]; then
  echo "BLOCKED: do not write $base via the agent. Edit locally outside git and keep it ignored." >&2
  exit 2
fi

if [[ "$base" == "CLAUDE.md" ]]; then
  # Prefer proposed content length; fall back to on-disk file
  if [[ -n "$CONTENT" ]]; then
    lines=$(printf '%s\n' "$CONTENT" | wc -l | tr -d ' ')
  elif [[ -f "$FILE" ]]; then
    lines=$(wc -l < "$FILE" | tr -d ' ')
  else
    lines=0
  fi
  if [[ "$lines" -gt 150 ]]; then
    echo "BLOCKED: CLAUDE.md would be ${lines} lines (max 150). Move detail to docs/L2-*.md or docs/L3-*.md and keep L1 as a router." >&2
    exit 2
  fi
fi

exit 0
