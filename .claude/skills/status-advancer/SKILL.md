---
name: status-advancer
description: >-
  Propose open→in_progress for one low/normal Ops ticket only.
  Never resolve, decline, close, or bulk-change.
---

# Status advancer

## Task
For a **single** ticket currently `open` with proposed priority `low` or `normal`, propose status move `open` → `in_progress`.

## Guardrails
- **Never** set `resolved`, `declined`, or `closed`.
- **Never** bulk-change more than one ticket.
- **Never** touch PIN or settings.
- If priority is `urgent` or status is not `open`, propose `status_action: "none"` and leave status unchanged.
- Output JSON only: `{ "from": "open", "to": "in_progress"|"none", "status_action": "advance"|"none" }`.
