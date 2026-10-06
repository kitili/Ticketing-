# Module 14 — Connect Slack, Notion, GitHub (Kitili Mbula)

Sharing: **Anyone with the link → Viewer**

**Main repo:** https://github.com/kitili/Ticketing-  
**Footer branch / open PR compare:** https://github.com/kitili/Ticketing-/compare/main...module14-footer-muwdj8kt?expand=1

---

## Part 1 — Connections (honest status)

| System | Status on real project |
|--------|------------------------|
| GitHub | Live on `kitili/Ticketing-` — branch pushed with footer + `assignment.md` |
| Slack | **Not live yet** — `SLACK_*` missing from `.env` on this machine |
| Notion | **Not live yet** — `NOTION_*` missing from `.env` |
| Keys | Template in `.env.example`; `.env` gitignored; nothing secret committed |
| Check-in interval | **30m** (same as Ops intake loop) |

Runner: `scripts/module14/run-assignment.js` (loads `.env`, never commits it).

---

## Part 2 — The run

Task executed (exact Slack text stored in `assignment.md`).

- **Footer:** added to `public/index.html` — “Kitili Mbula · Silverleaf Ops Ticket Desk” + “Built with Claude.”
- **assignment.md:** agent-written with **real observed values** and honest failures (no `<placeholders>`).
- **PR:** branch `module14-footer-muwdj8kt` pushed; `gh` not logged in → compare link above (open the PR from that URL).
- **Notion trail:** did not run — recorded as failure, not invented.

---

## Part 3 — Break on purpose

Broke webhook secret on one side only. Exact error:

`403 Forbidden: Slack signature mismatch (webhook secret differs)`

See `reflection.md` and `PROOF/module14/break-webhook-403.json`.

---

## To finish Part 1+2 for full marks

1. Fill `.env` with Slack + Notion tokens; add Notion integration under **Connections**; `/invite` the bot.  
2. `node scripts/module14/run-assignment.js` again.  
3. Open the GitHub compare link → Create pull request.  
4. Paste this doc + repo link on the LMS.
