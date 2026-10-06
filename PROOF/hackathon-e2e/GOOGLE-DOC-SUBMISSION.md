# Chrome MCP & E2E Hackathon — Combined Submission (Points 2–5)

**Student:** Kitili Mbula  
**Date:** 24 July 2026  

Paste this whole document into Google Docs → File → Share → General access → **Anyone with the link → Viewer**.

---

## A. Personal Bot — Princess Palace

### Live URL + demo credentials
- **Live:** https://personal-bot-kitili-mbula.netlify.app  
- **Repo:** https://github.com/kitili/personal-bot-kitili-mbula  
- **Demo login used in testing:** username `princess` / password `palace-demo`  
  (Local E2E used these. Live Netlify uses whatever `APP_USERNAME` / `APP_PASSWORD` you set in Site env.)

### Claude’s test report (flows)
Tested: wrong login, correct login, empty morning board, seal full board, empty wrap-up, sample wrap-up, focus timer, habits, mood, stickers, diary, tools/stats, Copy, logout.

**Worked:** Auth gate, board seal validation, wrap-up merge, timer, habits/mood/sparkles, diary entries, logout.

**Broken (fixed):** Copy ✨ showed dead-end `Copy failed` when Clipboard API blocked.

**Sketchy:** Fractional sparkles; empty inbox pin silent no-op.

### The one bug fixed
**Before:** Clipboard API failure → status `Copy failed`, no recovery.  
**After:** Clipboard → execCommand fallback → select fairy output + `Selected — press Ctrl/⌘+C`. Also network-first service worker + `aria-selected` on tabs.

**Re-test proof:** `personal-bot-kitili-mbula/PROOF/hackathon-e2e/03-copy-retest-after-fix.png`

### Moves 1–3 prompts
1. Install Chrome DevTools MCP and fully E2E-test the Princess Palace web app.  
2. Fix Copy so it never dead-ends when clipboard is blocked; bust stale SW cache.  
3. Re-run Wrap-Up → Copy and screenshot the new status.

### Reflection
Browser E2E caught a clipboard/PWA failure that code review missed. The service worker cache-first policy briefly hid the fix until we switched to network-first.

---

## B. Main Project — Ops Ticket Desk

### Live URL + demo credentials
- **Live:** https://ticketingsla.netlify.app  
- **Repo:** https://github.com/kitili/Ticketing-  
- **Department staff:** choose department + your name · **no PIN**  
- **Operations Manager PIN:** `Ops2026`

### Claude’s test report (flows)
Tested: live load, department login, empty ticket form, My tickets under unreachable DB, open ticket under unreachable DB, friendly error messaging. Manager PIN path needs a normal Chrome session with Supabase reachable (Cursor’s embedded browser could not fetch Supabase).

**Worked:** Login as department staff, HTML5 empty-form blocking, offline ticket queue after fix.

**Broken (fixed):** When browser was “online” but Supabase fetch failed, My tickets showed raw `TypeError: Failed to fetch` and open-ticket did not fall back to the offline queue.

### The one bug fixed
**Before:** `listRequests` / `submitRequest` only used offline fallback if `!navigator.onLine`.  
**After:** `isUnreachableError()` also treats Failed to fetch as offline → cache/outbox path; friendlier pin hint; login name `required`.

**Re-test proof:** Offline ticket `REQ-L-MRYME9TM-4AXS` created successfully; My tickets no longer shows TypeError.  
Screenshot: `silverleaf-ops-request-desk/PROOF/hackathon-e2e/03-offline-ticket-retest.png`

### Moves 1–3 prompts
1. Add Chrome MCP in the Ops Desk repo and E2E-test https://ticketingsla.netlify.app.  
2. Fix unreachable-DB handling so tickets list/submit fall back offline instead of TypeError.  
3. Re-test open ticket + My tickets; screenshot the queued offline ticket.

### Reflection
The offline architecture was already there — E2E proved the fallback gate was wrong. Field staff on flaky networks need “queue and sync,” not a raw TypeError.

---

## C. Form answers (copy/paste)

**Live URL + demo credentials of main project**  
https://ticketingsla.netlify.app — Department: any + your name (no PIN). Manager PIN: Ops2026

**Github Repo link of Main Project**  
https://github.com/kitili/Ticketing-

**Github Repo link of Personal Bot Project**  
https://github.com/kitili/personal-bot-kitili-mbula

**Google Doc Link**  
*(paste the share link after you upload this doc)*

**Live URL + demo credentials of Personal bot project**  
https://personal-bot-kitili-mbula.netlify.app — username: princess / password: palace-demo
