# Agents plan — Ops Ticket Desk intake orchestrator

## The one big job
**New-ticket intake:** when a department opens a ticket, Ops must classify priority, draft an acknowledgement, and safely advance status so staff know someone is on it.

**Why one agent shouldn’t own it alone:** classification, wording, and status mutation fail differently. Mixing them lets a single slip resolve a ticket, spam alerts, or invent urgency. The orchestrator only **splits and combines**; each sub-agent owns one task and one hard guardrail.

## Orchestrator
| Role | Job | Does not |
|------|-----|----------|
| `ticket-intake-orchestrator` | Read new inbox tickets, call the three sub-agents in order, merge into one run record, run evals | Classify, draft, or change status itself |

## Sub-agent map

| Sub-agent | Single task | Guardrail it cannot cross |
|-----------|-------------|---------------------------|
| `priority-sorter` | Propose `low` / `normal` / `urgent` from the ticket text | Never change status; never invent urgency words that are not in the ticket |
| `ack-writer` | Draft one short acknowledgement comment for Ops | Never promise a fix time; never send email/WhatsApp; never mention PIN/settings |
| `status-advancer` | For a **single** ticket with priority `low` or `normal`, propose `open` → `in_progress` | Never set `resolved` / `declined` / `closed`; never bulk-change; never touch PIN |

## Combine rule
The orchestrator’s combined result is valid only if:
1. Proposed priority matches the sorter’s output  
2. Ack text does not contradict that priority  
3. Status move is allowed only when priority is `low`/`normal` and current status is `open`  
4. No sub-agent output includes outbound notify or PIN/settings actions  

## Autonomy
- **Hook:** new JSON under `inbox/` → run orchestrator  
- **Loop:** every 30 minutes → drain inbox again  
- **Evals:** one per sub-agent + one synthesis check on the combined run  
