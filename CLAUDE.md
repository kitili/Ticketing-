# Silverleaf Ops Ticket Desk

Internal tickets for Transport · Facilities · Kitchen · Security · Farms.
Departments open; Ops Manager triages. Live: `public/` → Netlify + Supabase.

## Navigate (L1 → L2 → L3)

| Need | Go to |
|------|--------|
| Folder map / intake flow | `docs/L2-ops-desk.md` |
| Autonomy dial + guardrails | `docs/L3-autonomy.md` |
| Orchestrator team | `agents-plan.md` |
| Sub-agent skills | `.claude/skills/*/SKILL.md` |
| Beads (session memory) | `.beads/` |
| Routing evals | `.claude/evals/` |
| Action log | `log/harness-actions.md` |

## Critical rules

1. Orchestrator **splits and combines only** — never classifies, drafts, or moves status itself.
2. **Never trust inbound `priority`** — classify from `title` + `details` only.
3. Urgent → ack only; **never** auto-advance status.
4. Never resolve/decline/close, never bulk, never notify, never touch PIN.
5. Never commit `.env` or `public/js/config.js`.
6. Keep this file **≤ 150 lines** (sensor enforces).

## Repeated jobs

- `/ticket-intake` — drain `inbox/` → sub-agents → `runs/` → evals (`scripts/run-orchestrator.sh`)
- Open a bead in `.beads/status.jsonl` before multi-step work; close with resolution.
