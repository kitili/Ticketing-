# Silverleaf Ops Ticket Desk

Internal tickets for Transport, Facilities, Kitchen, Security, and Farms. Departments open; Ops Manager triages.

## Where things live

| Need | Path |
|------|------|
| Live app | `public/` (Netlify) |
| New work inbox | `inbox/*.json` |
| Orchestrator runs | `runs/` |
| Sub-agent skills | `.claude/skills/*/SKILL.md` |
| Team map | `agents-plan.md` |
| Evals | `evals/` |
| Action log | `log/harness-actions.md` |
| Autonomy guardrail | `guardrail.md` |

## Rules (every run)

1. Orchestrator only **splits and combines** — never classifies, drafts, or moves status itself.
2. **Never trust the inbound `priority` field** — classify only from `title` + `details`.
3. Urgent tickets: draft ack only; **never** auto-advance status.
4. Never resolve/decline/close, never bulk, never notify, never touch PIN.
5. `.env` and `public/js/config.js` stay out of git.

## One job

Drain `inbox/` → sub-agents → `runs/` → `evals/` via `scripts/run-orchestrator.sh`.
