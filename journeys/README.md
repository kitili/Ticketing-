# End-to-end journeys — Ops Ticket Desk

**Flow users cannot lose:** Department staff open a ticket and see it under My tickets.  
**Who is hurt if it silently breaks:** Transport/Facilities/Kitchen/Security/Farms staff lose the only structured channel to Ops; work stalls in WhatsApp.

## Journeys

| # | Screenshot | Result |
|---|------------|--------|
| 01 | `01-login-screen.png` | GREEN — login loads |
| 02 | `02-open-ticket-form.png` | GREEN — form after sign-in |
| 03 | `03-my-tickets-typeerror-gap.png` | RED — My tickets showed `TypeError: Failed to fetch` |
| 04 | `04-login-friendly-error-after-fix.png` | GREEN — friendly offline message (no TypeError) |
| 05 | `05-ticket-opened-offline-success.png` | GREEN — ticket opened offline (`REQ-L-…`) |
| 06 | `06-my-tickets-list-green.png` | GREEN — ticket listed with PENDING SYNC |

## Gap found

**Cause (one line):** When the browser was “online” but Supabase fetch failed, `listRequests` / `submitRequest` rethrew the raw error instead of falling back to the offline queue/cache.

**Fix:** `isUnreachableError()` + offline fallback in `public/js/api.js`, and `friendlyError()` in `public/js/app.js` so users never see `TypeError`.

**Re-run:** Journeys 04–06 reach the end after the fix.
