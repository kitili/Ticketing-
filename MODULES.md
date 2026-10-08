# Taleemabad modules — proof map (this repo)

**Repo:** https://github.com/kitili/Ticketing-  
**Live:** https://ticketingsla.netlify.app  

Use this table when the LMS form asks for a GitHub link. Everything below is on **`main`**.

| Module (LMS) | Course title | Where to look |
|--------------|--------------|---------------|
| **12** | Agentic Workflows — Build Your Orchestrator | [`PROOF/orchestrator/GOOGLE-DOC-SUBMISSION.md`](./PROOF/orchestrator/GOOGLE-DOC-SUBMISSION.md) · [`agents-plan.md`](./agents-plan.md) · `.claude/skills/` · `evals/` · hook + loop |
| **13** | Harness Series — Effective Harness (Assignment 2) | [`PROOF/harness-a2/GOOGLE-DOC-SUBMISSION.md`](./PROOF/harness-a2/GOOGLE-DOC-SUBMISSION.md) · [`CLAUDE.md`](./CLAUDE.md) · `.beads/` · `.claude/hooks/` · `.claude/evals/results.md` |
| **14** | Self-Healing & Self-Improving Agents | [`PROOF/self-heal/GOOGLE-DOC-SUBMISSION.md`](./PROOF/self-heal/GOOGLE-DOC-SUBMISSION.md) · [`POLICY.md`](./POLICY.md) · `scripts/self-heal/` |
| **15** *(course text also labels this **Module 14**)* | Connect Slack, Notion, GitHub — then prove it | [`PROOF/module14/GOOGLE-DOC-SUBMISSION.md`](./PROOF/module14/GOOGLE-DOC-SUBMISSION.md) · [`assignment.md`](./assignment.md) · [`reflection.md`](./reflection.md) · [`.env.example`](./.env.example) · homepage footer |

## Module 15 / Module 14 — Slack · Notion · GitHub

Placeholders live in [`.env.example`](./.env.example) (never commit `.env`):

- `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CHANNEL_ID`, `SLACK_WORKSPACE_NAME`
- `NOTION_TOKEN`, `NOTION_DATABASE_ID`
- `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET` (optional if `gh` / git already auth)

Runner: `node scripts/module14/run-assignment.js`  
Break proof: `node scripts/module14/break-webhook-secret.js` → `PROOF/module14/break-webhook-403.json`

### Finish live connections (you must paste real tokens once)

1. Create a Slack app, invite the bot to a channel, copy bot token + signing secret + channel ID into `.env`.
2. Create a Notion integration, **share the database under Connections**, copy token + database ID into `.env`.
3. Re-run `node scripts/module14/run-assignment.js` so `assignment.md` gets real channel / card / PR values.
4. Keep `.env` gitignored.

Until those tokens exist on this machine, `assignment.md` records **honest failures** (not placeholders). Part 3 reflection + webhook-break proof are already complete.
