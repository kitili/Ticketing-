#!/usr/bin/env bash
# PreToolUse: block dangerous Bash (force-push, rm -rf, committing secrets patterns)
set -euo pipefail
INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "
import sys, json
d=json.load(sys.stdin)
ti=d.get('tool_input') or d.get('input') or {}
print(ti.get('command') or ti.get('cmd') or '')
" 2>/dev/null || echo "")

lower=$(echo "$CMD" | tr '[:upper:]' '[:lower:]')

if echo "$lower" | grep -Eq 'git[[:space:]]+push[[:space:]]+.*--force|git[[:space:]]+push[[:space:]]+-f[[:space:]]|git[[:space:]]+push[[:space:]]+--force-with-lease'; then
  if echo "$lower" | grep -Eq 'origin[[:space:]]+(main|master)|[[:space:]]+(main|master)[[:space:]]*$'; then
    echo "BLOCKED: force-push to main/master is denied. Use a feature branch PR instead." >&2
    exit 2
  fi
  echo "BLOCKED: force-push is denied by harness sensors." >&2
  exit 2
fi

if echo "$lower" | grep -Eq 'rm[[:space:]]+-rf[[:space:]]+/|rm[[:space:]]+-rf[[:space:]]+\*|git[[:space:]]+clean[[:space:]]+-fdx'; then
  echo "BLOCKED: destructive rm/clean denied. Narrow the path and ask a human." >&2
  exit 2
fi

# Block real dotenv vaults; allow templates like .env.example
if echo "$CMD" | grep -Eqi 'git[[:space:]]+(add|rm|commit).*[[:space:]](\./)?\.env([[:space:]]|"|$)' \
  || echo "$CMD" | grep -Eqi 'git[[:space:]]+add[[:space:]]+(\./)?\.env([[:space:]]|"|$)'; then
  echo "BLOCKED: refusing to stage/commit .env. Keep secrets out of git; rotate if already exposed." >&2
  exit 2
fi

exit 0
