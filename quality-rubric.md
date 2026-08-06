# Quality rubric — Ops Ticket Desk messages

**What is scored:** short user-facing status / error / success messages shown when opening tickets, listing tickets, or syncing offline.  
**Who reads them:** Silverleaf department staff and the Operations Manager under time pressure.

A good message scores **yes** on all five lines:

1. Says what happened or what went wrong in plain English.
2. Says what to do next (retry, sync, fill a field, ask manager, wait).
3. Avoids raw technical jargon (`TypeError`, `undefined`, stack traces, SQL).
4. Does not blame the user ("you messed up", "invalid input idiot").
5. Is under 20 words.

Score each sample **yes/no per line**. A message "passes" only if all five are yes.
