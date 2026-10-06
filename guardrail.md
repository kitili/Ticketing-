# Guardrail — Silverleaf Ops Ticket Desk (main project)

## What it does / who is hurt
Internal ticket desk for Transport, Facilities, Kitchen, Security, and Farms. Departments open tickets; the Operations Manager triages them. If triage silently goes wrong, department staff wait on broken buses/pumps/kitchens, and Ops loses trust in the inbox.

## Task on the dial
**Task:** When a new ticket arrives, draft a triage suggestion (priority nudge + short acknowledgement comment) and, if priority is `low` or `normal`, auto-set status from `open` → `in_progress` for the Ops Manager to finish.

**Can I undo it in time?** Mostly yes — status can be moved back and comments can be corrected — but a wrong `resolved`/`declined` or a noisy mass ping wastes real staff time before anyone notices.

**Dial today: 4 / 10** (low-middle). Undoable in principle, but the blast radius is other people’s workday, so it starts low and earns trust.

## The one guardrail rule
Under this, go ahead: suggest triage and auto-move only `open` → `in_progress` on a single new ticket with priority `low`/`normal`; over this, ask me first: any `resolved`/`declined`/`closed`, bulk changes, PIN/settings edits, deletes, or outbound email/WhatsApp alerts.

## One-minute pre-mortem (hostile stranger)
1. **Trick it?** Yes — flood the inbox with fake “urgent” tickets or spoofed department names to force bad auto-triage.
2. **Do too much?** Yes — a loose rule could bulk-flip dozens of tickets or spam acknowledgements.
3. **Something I cannot undo?** Yes — change the Manager PIN, wipe history, or fire irreversible notification blasts to staff phones/inboxes.

**Irreversible risk that hurts most:** outbound notification spam or PIN/settings takeover — easy to trigger if the helper is over-trusted, and you cannot unsend every message or recover a stolen PIN without a painful reset.

**Stop-and-ask forever (ceiling):** never auto-send notifications, never change PIN/settings, never bulk-resolve/decline — however good the week’s triage score is.

## Slider by evidence
**Today: 4 / 10.**

- **Raise to 5** after **20** consecutive correct single-ticket `open`→`in_progress` suggestions with zero wrong-department acknowledgements.
- **Raise to 6** after **39 of the last 40** triage actions match what the Ops Manager would have done (reviewed weekly).
- **Drop back to 3** after **one** wrong auto-status that a department treats as “Ops is on it” when nobody is — or any attempt to touch PIN, bulk status, or outbound alerts.
