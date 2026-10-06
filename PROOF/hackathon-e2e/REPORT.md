# Hackathon E2E Report — Ops Ticket Desk (Main Project)

**Project:** Silverleaf Ops Ticket Desk  
**Date:** 2026-07-24  
**Live URL:** https://ticketingsla.netlify.app  
**Repo:** https://github.com/kitili/Ticketing-  
**Chrome MCP:** `chrome-devtools ✓ Connected` (Claude Code, this project)

## Demo credentials

| Role | How to sign in |
|------|----------------|
| Department staff | Role: Department staff · pick any dept · enter your name · **no PIN** |
| Operations Manager | Role: Operations Manager · PIN: **`Ops2026`** |

## Flows mapped (before testing)

1. Department staff login (no PIN)
2. Open a ticket (empty form + happy path)
3. My tickets list / ticket detail
4. Manager login (wrong PIN + `Ops2026`)
5. Manager inbox / status change / export
6. Logout

## What was tested

| Flow | Result |
|------|--------|
| Live site loads | ✅ HTTP 200 |
| Department login with name | ✅ Enters Transport desk |
| Empty ticket submit | ✅ HTML5 required fields block submit |
| My tickets when DB unreachable | ❌ then ✅ after fix |
| Open ticket when DB unreachable | ❌ then ✅ queues offline (`REQ-L-…`, pending sync) |
| Friendly pin-hint when DB down | ❌ then ✅ after fix |
| Manager PIN path | ⚠️ Needs live Supabase from a normal Chrome session (Cursor browser could not reach Supabase) |

## Bugs found

### ❌ High — Online but unreachable DB broke the offline path
**Step:** Sign in as department staff → open **My tickets** (or submit a ticket) while Supabase fetch fails but `navigator.onLine === true`.  
**Before:** UI showed raw `TypeError: Failed to fetch`. Ticket submit failed instead of queuing offline.  
**Cause:** `listRequests` / `submitRequest` only fell back offline when `!navigator.onLine`, not when fetch failed.

### ⚠️ Medium — Login name not HTML-required
Name was validated in JS with a toast, but the input lacked `required` (weaker empty-path UX).

## Fix (before → after)

**Before:** Fetch failure while “online” → crashy `TypeError` in My tickets; open-ticket did not queue.  
**After:** `isUnreachableError()` treats Failed to fetch like offline → list falls back to cache/outbox; submit queues locally; pin hint is human-readable; login name is `required`.

**Re-test:** Opened ticket `REQ-L-MRYME9TM-4AXS` offline with status Open / pending sync. My tickets no longer shows TypeError.  
Screenshot: `PROOF/hackathon-e2e/03-offline-ticket-retest.png`

## Moves 1–3 prompts

1. Set up Chrome DevTools MCP and E2E-test https://ticketingsla.netlify.app (department + manager flows).  
2. Fix unreachable-DB handling so My tickets / Open ticket fall back offline instead of TypeError.  
3. Re-test open ticket + My tickets and screenshot the queued offline ticket.

## Reflection

The product already had an offline queue — the bug was the gate around it. Real networks fail even when the browser thinks it’s online; E2E in a restricted browser made that failure mode obvious. Fixing the fallback matters more for Ops staff in the field than polishing happy-path UI.
