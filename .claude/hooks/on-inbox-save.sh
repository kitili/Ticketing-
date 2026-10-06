#!/usr/bin/env bash
# Hook: run ticket-intake orchestrator when new work lands in inbox/
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path','') or d.get('file_path',''))" 2>/dev/null || echo "")

if [[ "$FILE_PATH" != *"/inbox/"* ]] && [[ "$FILE_PATH" != *"inbox/"* ]]; then
  exit 0
fi
if [[ "$FILE_PATH" == *.processed.json ]]; then
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
export ORCH_TRIGGER=hook
bash "$ROOT/scripts/run-orchestrator.sh"

echo '{"additionalContext": "Ticket-intake orchestrator hook fired after inbox save. Combined run + evals written."}'
