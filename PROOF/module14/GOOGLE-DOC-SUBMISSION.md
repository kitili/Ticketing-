# Module 15 / Module 14 — Connect Slack, Notion, GitHub (Kitili Mbula)

Sharing: **Anyone with the link → Viewer**

**Main repo (use this link on the LMS):** https://github.com/kitili/Ticketing-  
**Branch:** `main` (footer, `assignment.md`, `reflection.md`, `.env.example` placeholders)

> Course PDF titles this **Module 14**. Some LMS screens call the same assignment **Module 15**. Same repo, same files.

---

## Part 1 — Connections (status on real project)

| System | Status |
|--------|--------|
| GitHub | Live on `kitili/Ticketing-` — footer + `assignment.md` on **`main`** |
| Slack | Placeholders in `.env.example` (`SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CHANNEL_ID`, `SLACK_WORKSPACE_NAME`). Fill `.env` locally to go live. |
| Notion | Placeholders in `.env.example` (`NOTION_TOKEN`, `NOTION_DATABASE_ID`). Integration must be added under Notion **Connections**. |
| Keys | Template in `.env.example`; `.env` gitignored; nothing secret committed |
| Check-in interval | **30m** (`CHECKIN_INTERVAL` / Ops intake loop) |

Runner: `scripts/module14/run-assignment.js` (loads `.env`, never commits it).

README documents Slack + Notion: see repo root `README.md` → **Slack & Notion (Module 15)**.

---

## Part 2 — The run

Task text is stored exactly in [`assignment.md`](../../assignment.md).

- **Footer:** `public/index.html` — “Kitili Mbula · Silverleaf Ops Ticket Desk” + “Built with Claude.”
- **assignment.md:** agent-written with **real observed values** and honest failures where Slack/Notion tokens were not yet in `.env` (no invented channel/card placeholders).
- **PR / merge:** work landed on **`main`** so graders see it without hunting a side branch.
- **Notion trail:** runs when `NOTION_*` are set; otherwise recorded as failure, not invented.

---

## Part 3 — Break on purpose

Broke webhook secret on one side only. Exact error:

`403 Forbidden: Slack signature mismatch (webhook secret differs)`

See [`reflection.md`](../../reflection.md) and [`break-webhook-403.json`](./break-webhook-403.json).

---

## To finish Part 1+2 for full live marks

1. Fill `.env` from `.env.example` with real Slack + Notion tokens; share Notion DB under **Connections**; `/invite` the bot.  
2. `node scripts/module14/run-assignment.js` again (rewrites `assignment.md` with live values).  
3. Paste this doc + https://github.com/kitili/Ticketing- on the LMS.
