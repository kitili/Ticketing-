# Agentic Workflows — Build Your Orchestrator (Kitili Mbula)

Sharing: **Anyone with the link → Viewer**

---

## 1 · The workflow — the sub-agent map + skills

**The one big job**  
Ops Ticket Desk **new-ticket intake**: classify priority, draft an acknowledgement, and safely advance status so departments know Ops is on it. One agent shouldn’t own it alone — mixing classification, wording, and status mutation lets a single slip resolve a ticket or invent urgency.

**Sub-agent map** (from `agents-plan.md`)

| Agent | Task | Guardrail |
|-------|------|-----------|
| `priority-sorter` | Propose `low`/`normal`/`urgent` from ticket text | Never change status; never invent urgency |
| `ack-writer` | Draft one short acknowledgement | No fix-time promises; no email/WhatsApp; no PIN talk |
| `status-advancer` | Single-ticket `open`→`in_progress` for low/normal | Never resolve/decline/close; never bulk; never touch PIN |

Orchestrator (`ticket-intake-orchestrator`) only splits and combines.

**Skills committed:** `.claude/skills/<name>/SKILL.md` for each of the four roles above.

**Repo:** https://github.com/kitili/Ticketing-  
(`.env` ignored; skills committed.)

---

## 2 · Autonomous + checked — hooks, loop, evals

**Hook:** `.claude/settings.json` → PostToolUse on Write|Edit → `.claude/hooks/on-inbox-save.sh` when a file under `inbox/` is saved → `scripts/run-orchestrator.sh`.

**Loop:** every **30 minutes** — `LOOPS.md` / `.claude/loop.md`:
```
/loop 30m Run the ticket-intake orchestrator: drain inbox/, split to sub-agents, combine runs/, run evals/
```

**Evals** (`evals/`)
- `priority-sorter.md` — task + no invented urgency  
- `ack-writer.md` — task + no promises/notify/PIN  
- `status-advancer.md` — task + no terminal/bulk/urgent advance  
- `synthesis.md` — combined pieces agree  

**Guardrail-break caught**  
With a buggy status-advancer, urgent bus ticket `T-1002` was set to `resolved`. Evals failed on status-advancer + synthesis. **Fix:** urgent always `status_action: none`; re-ran with default (non-buggy) path — **all evals PASS** (`evals/last-run.md`, `evals/guardrail-break.md`).

**Repo:** https://github.com/kitili/Ticketing-  
(settings hook + `evals/` committed; `.env` not.)

---

## 3-line reflection

1. Big job is **new-ticket intake** — split into priority-sorter / ack-writer / status-advancer, each with one hard guardrail.  
2. Eval caught **status-advancer resolving an urgent ticket**; fix was “urgent ⇒ no auto status move,” then re-run until green.  
3. Loop still can’t be trusted to **auto-notify staff or resolve tickets** — next eval would fail any combined result with `notify: true` or terminal status (already partially covered; keep that ceiling forever).
