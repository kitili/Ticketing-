# Module 10 Assessment — Evals

**Student:** Kitili Mbula  
**Date:** 6 August 2026  

Paste into Google Docs → Share → Anyone with the link → **Viewer**.

---

## 1 · Personal bot — rubric + judge

**Bot:** Princess Palace  
**What it produces / who reads it:** Daily Wrap-Up markdown (Done / Doing / Next) for Kitili — end-of-day reflection and LMS logs.

### Rubric (`quality-rubric.md`)

1. Has exactly three sections titled `## Done`, `## Doing`, and `## Next` (in that order).  
2. Every bullet under those sections starts with `- `.  
3. No section has more than 5 bullets.  
4. Bullets are concrete actions or outcomes (not vague filler).  
5. Includes a footer line that mentions `daily-wrap-up` or the trigger/timestamp.

### Judge scored results (summary)

See full table in repo: `PROOF/evals/judge-results.md`.  
Clean wrap-ups pass all five; “just vibes” / letter fillers fail line 4.

### Hand-check agreement

**18 / 20** (90%). Hardest line: #4 (concrete vs filler).

### Git repo

https://github.com/kitili/personal-bot-kitili-mbula  
(`quality-rubric.md` committed; `.env` not)

---

## 2 · Main project — end-to-end eval + rubric + judge

**Project:** Silverleaf Ops Ticket Desk (Ticketing-)  
**Flow users cannot lose:** Department staff open a ticket and see it under My tickets.  
**Who is hurt if it breaks:** Ops departments lose their structured channel to the Operations Manager.

### End-to-end screenshots (`journeys/`)

| Shot | Status |
|------|--------|
| 01 login screen | GREEN |
| 02 open-ticket form | GREEN |
| 03 My tickets TypeError | RED (gap) |
| 04 friendly error after fix | GREEN |
| 05 ticket opened offline | GREEN |
| 06 My tickets list with pending sync | GREEN |

### Gap + fix

**Gap:** My tickets (and related paths) showed raw `TypeError: Failed to fetch` when Supabase was unreachable while `navigator.onLine` was true — journey stopped between “signed in” and “see my tickets.”  

**Fix:** Treat fetch failures as unreachable → offline cache/outbox + friendly copy (`api.js` / `app.js`).

### Rubric (`quality-rubric.md`)

1. Says what happened / went wrong in plain English.  
2. Says what to do next.  
3. Avoids raw jargon (`TypeError`, stacks).  
4. Does not blame the user.  
5. Under 20 words.

### Judge scored results

Full sheet: `PROOF/evals/judge-results.md`.  
Raw `TypeError` fails lines 1–3; post-fix offline messages pass all five.

### Hand-check agreement

**19 / 20** (95%). Hardest line: #2 (must include a next action).

### Git repo

https://github.com/kitili/Ticketing-  
(`journeys/` + `quality-rubric.md` committed; `.env` not)

---

## 3-line reflection

1. Main project: **5/6 journeys green after fix**; the gap was My tickets dying on `TypeError: Failed to fetch` between login and list.  
2. Judge agreement: personal bot **18/20**, main project **19/20**.  
3. I would sharpen personal-bot line 4 to ban placeholder phrases like “(see notes for today)” so filler cannot pass as “concrete.”

---

## LMS paste bank

| Field | Value |
|------|--------|
| Personal bot GitHub | https://github.com/kitili/personal-bot-kitili-mbula |
| Main project GitHub | https://github.com/kitili/Ticketing- |
| Google Doc (this doc) | *(upload → Anyone with link → Viewer)* |
