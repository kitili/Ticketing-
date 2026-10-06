# Loop — Ticket intake orchestrator

## Schedule
**Every 30 minutes** while the Claude session is open.

## Claude Code / Cursor command
```
/loop 30m Run the ticket-intake orchestrator: drain inbox/, split to sub-agents, combine runs/, run evals/
```

## What happens
1. Scheduler fires every 30 minutes
2. Orchestrator reads new `inbox/*.json`
3. Sub-agents run (priority → ack → status)
4. Combined result lands in `runs/`
5. `evals/` checks each sub-agent + synthesis

## Stop
Esc while waiting, or cancel the scheduled `/loop` task.

## Proof
See `PROOF/orchestrator/run-log.md` and `evals/last-run.md`.
