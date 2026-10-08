# Silverleaf Ops Ticket Desk

# Ticketing-

Simple internal **ticket system** for Silverleaf operations: five departments open tickets; the Operations Manager manages them; departments close when resolved.

**Live URL:** https://ticketingsla.netlify.app  
**Repo:** https://github.com/kitili/Ticketing-

**Production stack:** Static HTML/CSS/JS + **Supabase** (free DB) + **Netlify** (free hosting).  
**No Node server required** for live deployment.

**Offline:** PWA + local queue — open tickets and manager actions without network; sync when back online.  
**Notifications:** Email (Resend) and optional WhatsApp (Twilio) via Supabase Edge Function — see [NOTIFICATIONS.md](./NOTIFICATIONS.md).

## Modules 12–15 (assessment proof)

Full map: **[MODULES.md](./MODULES.md)**.

| Module | Topic | Proof |
|--------|-------|-------|
| **12** | Orchestrator (sub-agents + hook + loop + evals) | [`PROOF/orchestrator/`](./PROOF/orchestrator/) · [`agents-plan.md`](./agents-plan.md) · `.claude/skills/` |
| **13** | Effective harness (guides, sensors, beads, report card) | [`PROOF/harness-a2/`](./PROOF/harness-a2/) · [`CLAUDE.md`](./CLAUDE.md) · `.beads/` |
| **14** | Self-healing intake loop (act → critic → retry → remember) | [`PROOF/self-heal/`](./PROOF/self-heal/) · [`POLICY.md`](./POLICY.md) · `scripts/self-heal/` |
| **15** | **Slack + Notion + GitHub** trail (course text: “Module 14”) | [`PROOF/module14/`](./PROOF/module14/) · [`assignment.md`](./assignment.md) · [`reflection.md`](./reflection.md) |

### Slack & Notion (Module 15)

Env placeholders are in [`.env.example`](./.env.example) — copy to `.env` locally, never commit secrets:

```bash
cp .env.example .env
# fill SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_CHANNEL_ID,
# NOTION_TOKEN, NOTION_DATABASE_ID (and optional GITHUB_TOKEN)
node scripts/module14/run-assignment.js
```

Homepage footer (Module 15 task): **Kitili Mbula · Silverleaf Ops Ticket Desk** + **Built with Claude.**

## Departments

Transport · Facilities · Kitchen · Security · Farms

## Workflow

1. **Open ticket** → `open`
2. Manager: **In progress** / **Pending info** / **Resolved** / **Declined**
3. Department **Close ticket** (after Resolved) → `closed`
4. Manager **Export CSV**

## Manager PIN

- Departments: **no PIN**
- Manager default PIN (after running schema): **`Ops2026`**
- Change in Manager → **Settings**

## Deploy (free)

See **[DEPLOY.md](./DEPLOY.md)** — Supabase + Netlify in ~10 minutes.  
Set up alerts: **[NOTIFICATIONS.md](./NOTIFICATIONS.md)**.

## Offline use

1. Open the site **once while online** (installs cache + manager PIN for offline login).
2. On poor network: submit tickets, add comments, change status — changes show **pending sync**.
3. When online again, tap **Sync now** or wait for automatic sync.
4. Add to home screen (phone) for quickest access — uses `manifest.webmanifest`.

## Local dev

```bash
cp public/js/config.example.js public/js/config.js
# add Supabase URL + anon key to config.js
cd public && python3 -m http.server 8080
```

## Project layout

```
public/                 ← frontend (Netlify publish dir)
.claude/skills/         ← Module 12 sub-agent skills
.claude/hooks/          ← harness sensors + inbox orchestrator hook
.beads/                 ← Module 13 memory
evals/                  ← Module 12 evals
scripts/self-heal/      ← Module 14 self-heal loop
scripts/module14/       ← Module 15 Slack/Notion/GitHub runner
PROOF/                  ← Google Doc drafts + evidence per module
assignment.md           ← Module 15 agent run report
reflection.md           ← Module 15 hand-written break report
MODULES.md              ← LMS module → file map
.env.example            ← includes SLACK_* and NOTION_* placeholders
supabase/schema.sql
netlify.toml
DEPLOY.md
NOTIFICATIONS.md
```

Legacy Node/SQLite: `server.js`, `db.js` (optional local use).
