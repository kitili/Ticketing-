---
name: ticket-intake
description: >-
  Drain inbox tickets through the orchestrator sub-agents, write runs/, run evals.
  Use when new JSON lands in inbox/ or when asked to run /ticket-intake.
---

# /ticket-intake

## Task
Run the ticket-intake orchestrator end to end.

## Steps
1. Confirm open beads in `.beads/status.jsonl` (or open one for this run).
2. `bash scripts/run-orchestrator.sh`
3. Read `evals/last-run.md` — if FAIL, stop and fix the failing skill.
4. Append a close line to the status bead with how to verify.

## Guardrails
- Do not edit `.env` or `public/js/config.js`.
- Do not force-push or resolve urgent tickets.
