# Module 15 / Module 14 — reflection.md (Part 3 — written by hand)

I broke the **webhook signing secret on one side only** on purpose. I picked that one because the assignment listed it as a clean 403, and it is the kind of silent failure that looks like “Slack is fine” while every delivery dies.

## Exact error I saw

```
403 Forbidden: Slack signature mismatch (webhook secret differs)
```

Reproduced with:

```bash
node scripts/module14/break-webhook-secret.js
```

Proof file: `PROOF/module14/break-webhook-403.json` — matching secrets allowed; tampered host secret blocked with status 403.

## Where I looked first

I looked at the local verifier output and the JSON proof under `PROOF/module14/` first, not the Slack UI. That was the right place for this deliberate break, because the failure is signature math on the request, not a missing channel invite.

## How I fixed it

I put the **same** signing secret back on both sides (Slack app config and host `SLACK_SIGNING_SECRET`). After they match, verification allows the body again. I also kept `.env` out of git so the secret cannot drift by getting committed and rotated overnight.

## What still is not connected (honest)

On this machine, Part 1 is incomplete: there is no `.env` with live `SLACK_BOT_TOKEN` / `NOTION_TOKEN` yet. The footer branch and `assignment.md` still ran; Slack and Notion steps recorded honest failures instead of placeholders.
