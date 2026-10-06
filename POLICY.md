# Self-improvement policy — Ops Ticket Desk intake

## May change itself alone
| Item | Why |
|------|-----|
| Retry with critic reason (≤3 tries) | Self-healing execution; model unchanged; bounded cost |
| Append lessons to `scripts/self-heal/store/instructions.jsonl` for F1–F3 after a successful heal | Prevents the same checkable failure from burning retries next run |
| Append-only lines in `.beads/failures.jsonl` and `log/harness-actions.md` | Memory / audit trail only — no behaviour change without a check |
| Re-run routing / intake evals and write `evals/*` reports | Measurement, not authority |

## Only with a person
| Item | Why |
|------|-----|
| Autonomy dial number and stop-and-ask ceiling (`docs/L3-autonomy.md`, `guardrail.md`) | Rules that bound blast radius |
| Live status writes to Supabase / any `resolved`/`declined`/`closed` | Touches real Ops work and trust |
| Outbound email / WhatsApp notify | Irreversible comms |
| Manager PIN / settings | Credentials and control plane |
| Fine-tuning or swapping the model | Model-itself rung — see five-point check |
| Changing critic failure definitions that loosen safety (e.g. allow urgent auto-advance) | Weakening checks is a policy change |

## Five-point fine-tune check (this task)

| # | Question | Answer |
|---|----------|--------|
| 1 | Narrow — one well-defined repeating task? | **Yes** — ticket intake priority/ack/status proposal |
| 2 | High volume — small gains worth the cost? | **No** — dozens of tickets/day, not thousands |
| 3 | Real dataset of good/bad outputs? | **Partial** — fixtures + critic labels, not a large labeled set |
| 4 | Measurable new-vs-old model? | **Yes in principle** — but we already measure the *system* (retries) |
| 5 | Stable task for months? | **Yes** — intake shape is stable |

**Fewer than five yeses → fix the system, not the model.**  
Ladder rung we were on: **5 · The check** (missing permanent instructions + critic), then **3 · Instructions store**. Not the job, not the weights.

## Diagnosis ladder (used here)
1. Ask — clear enough once failures were named checkably  
2. Context — inbound priority was misleading context  
3. Tools — N/A  
4. Workflow — single-ticket intake is fine  
5. Check — critic + instructions store fixed it  
6. Job — not a model incapability  
