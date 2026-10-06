# Orchestrator run log

## Hook simulation
Triggered `.claude/hooks/on-inbox-save.sh` with an inbox Write event → `scripts/run-orchestrator.sh`.

## Loop
Configured in `LOOPS.md` / `.claude/loop.md` as `/loop 30m` for ticket-intake orchestrator.

## Evals
1. Buggy run (`ORCH_BUGGY=1`): status-advancer resolved urgent T-1002 → FAIL (see `evals/guardrail-break.md`).
2. Fixed run (default): all sub-agent + synthesis evals PASS (`evals/last-run.md`).
