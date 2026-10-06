---
name: priority-sorter
description: >-
  Propose low/normal/urgent for one Ops ticket from its text only.
  Never change status or invent urgency.
---

# Priority sorter

## Task
Read one ticket’s `title` + `details` and propose exactly one priority: `low`, `normal`, or `urgent`.

## Guardrails
- **Never change ticket status.**
- **Never invent urgency** — only mark `urgent` when the ticket text clearly uses safety, outage, injury, fire, flood, or “urgent”/“emergency” language.
- Output JSON only: `{ "priority": "...", "reason": "..." }`.
- One ticket per call.
