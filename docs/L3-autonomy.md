---
type: L3
last_verified: 2026-10-06
owner: kitili
---

# L3 — Autonomy and irreversible risks

## Dial today
Single-ticket triage suggestion + safe `open` → `in_progress` for `low`/`normal` only — **4 / 10**.

## Stop-and-ask forever
- Outbound email / WhatsApp notifications
- Manager PIN or settings changes
- Bulk status changes
- `resolved` / `declined` / `closed` without a human

## Pre-mortem (worst hurts most)
Notification blast or PIN takeover — easy if over-trusted, hard to undo.

## Evidence to raise
- Raise to 5 after 20 clean single-ticket advances
- Raise to 6 after 39/40 match Ops Manager judgment
- Drop to 3 on one misleading auto-status or any PIN/bulk/alert attempt

See also: root `guardrail.md`.
