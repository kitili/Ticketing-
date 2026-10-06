# Self-Healing & Self-Improving — Assignment (Kitili Mbula)

Sharing: **Anyone with the link → Viewer**  
**Code:** https://github.com/kitili/Ticketing- → `scripts/self-heal/`

---

## 1 · Three named failures

**Task:** Ops ticket intake — input one ticket JSON; output proposed priority + ack + status action; runs on every inbox hook / 30‑min loop.

| ID | Checkable failure | How we find out today |
|----|-------------------|------------------------|
| `F1_inbound_spoof` | `priority===urgent` while title+details lack urgent/emergency/outage language | Mid-shift when a cosmetic ticket clogs the urgent queue |
| `F2_urgent_advance` | `priority===urgent` and `status_action===advance` (or terminal status) | Department chases a “handled” emergency nobody owns |
| `F3_bad_ack` | Empty ack, or ack matches ETA/PIN/WhatsApp language, or `notify===true` | Screenshot of a promised “within an hour” reply |

---

## 2 · The critic

**Flavour: plain rules** (`scripts/self-heal/critic.js`) — free, instant; no model call.  
Every failure these three are exactly statable as regex/equality checks.

Returns `{ ok, reason, failure_id }` — the **reason** is what the retry feeds back (never bare “failed”).

---

## 3 · The loop

`scripts/self-heal/loop.js`: act → critic → retry with **accumulated** reason → cap **3** → escalate trail to `logs/escalations.jsonl`.

**Real run (SH-01 spoof):** try0 F1 → try1 F3 → try2 PASS (`PROOF/self-heal/fail-retry-pass.md`).

---

## 4 · Before-and-after (memory = instructions store)

| | Runs | Passes | Retries (sum) | Escalations |
|--|------:|-------:|--------------:|------------:|
| **Before** (heal only, no store) | 10 | 10 | **17** | 0 |
| **After** (`store/instructions.jsonl`) | 10 | 10 | **0** | 0 |

All three failures stored in **instructions** — the agent was never permanently told the rules; feedback healed one run, the store stops the next from needing retries.

---

## 5 · POLICY.md + five-point check

See root `POLICY.md`.  
May self-change: capped retries, append instruction lessons, eval reports.  
Always human: dial/guardrails, live resolve/notify/PIN, fine-tunes, loosening critics.

Five-point fine-tune: **not five yeses** (volume + dataset short) → fix the system (rung: **check → instructions**), not the weights.

---

## 3-line reflection

1. Self-healing cut silent wrong outputs; self-improving cut retries **17 → 0** by storing F1–F3 in instructions.  
2. Cheapest critic that worked was **plain rules** — a model critic would have been waste.  
3. The line we will not cross alone: **live status / notify / PIN** — those stay human even when the loop is green.
