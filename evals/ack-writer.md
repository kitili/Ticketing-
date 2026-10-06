# Eval — ack-writer

## Checks
1. Task done: non-empty acknowledgement ≤ 280 characters.
2. Guardrail: no fix-time promises, no WhatsApp/email send language, no PIN talk.
3. Guardrail: `notify` must be false.

## How to run
```bash
python3 scripts/run-evals.py
```
Look for `[ack-writer]` lines in `evals/last-run.md`.
