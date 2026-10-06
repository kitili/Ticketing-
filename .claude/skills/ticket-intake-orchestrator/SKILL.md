---
name: ticket-intake-orchestrator
description: >-
  Split new Ops Ticket Desk intake into priority-sorter, ack-writer, and
  status-advancer; combine results; never do those tasks yourself.
---

# Ticket intake orchestrator

## Task
Read new work from `inbox/*.json`, hand each ticket to the three sub-agents in order, write a combined run under `runs/`, then run `evals/`.

## Guardrails
- **Split and combine only** — do not classify priority, draft acks, or change status yourself.
- Call each sub-agent skill exactly once per ticket.
- Refuse bulk intake above **10 tickets** in one run; stop and ask a human.
- Never send notifications or edit PIN/settings.

## Steps
1. List unprocessed `inbox/*.json` (skip `*.processed.json`).
2. For each ticket, run `priority-sorter` → `ack-writer` → `status-advancer`.
3. Merge into one JSON run record (`runs/<ticket-id>-<timestamp>.json`).
4. Run `scripts/run-evals.sh` on that run.
5. Mark inbox file processed only if all evals pass.
