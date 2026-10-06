#!/usr/bin/env bash
# Run ticket-intake orchestrator (split → sub-agents → combine).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p inbox runs
python3 "$ROOT/scripts/orchestrator.py"
python3 "$ROOT/scripts/run-evals.py"
