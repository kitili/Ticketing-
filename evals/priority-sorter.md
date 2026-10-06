# Eval — priority-sorter

## Checks
1. Task done: output is exactly one of `low` | `normal` | `urgent`.
2. Guardrail: never invent `urgent` without matching words in the ticket text.
3. Guardrail: never change ticket status.

## How to run
```bash
python3 scripts/orchestrator.py
python3 scripts/run-evals.py
```
Look for `[priority-sorter]` lines in `evals/last-run.md`.
