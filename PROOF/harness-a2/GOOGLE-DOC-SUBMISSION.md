# Module 13 — Assignment 2 — Effective Harness (Kitili Mbula)

Sharing: **Anyone with the link → Viewer**  
**Main repo:** https://github.com/kitili/Ticketing-

---

## 1 · CLAUDE.md — L1 router + one L2/L3 doc

**L1** (`CLAUDE.md`, 30 lines): navigation table + critical rules only (≤150 enforced by sensor).

**L2** (`docs/L2-ops-desk.md`): folder router with YAML frontmatter (`type`, `last_verified`, `owner`).

**L3** (`docs/L3-autonomy.md`): autonomy dial, stop-and-ask forever, evidence slider.

**Skill:** `.claude/skills/ticket-intake/SKILL.md` (`/ticket-intake`).

---

## 2 · Sensors — settings + hooks + block proof

`.claude/settings.json` wires:
- **SessionStart** → re-inject open beads  
- **PreToolUse** Bash → block `.env` stage/commit + force-push to main  
- **PreToolUse** Write|Edit → block fat `CLAUDE.md` (>150) and `.env`/`config.js` writes  
- **PostToolUse** → validate `CLAUDE.md` length + inbox orchestrator hook  
- **Stop** → warn if beads still open  

**Screenshot:** `PROOF/harness-a2/hook-block-screenshot.png` — PreToolUse exit 2 blocking force-push, `.env` add, and 160-line `CLAUDE.md`.

---

## 3 · Memory — `.beads/`

| File | Real entry |
|------|------------|
| `status.jsonl` | `bd-001` opened+closed for this harness build; `bd-002` open (weekly eval watch) |
| `decisions.jsonl` | `dec-001` — L1 router vs fat CLAUDE.md |
| `failures.jsonl` | `fail-001` — trusted spoofed inbound `priority` on T-1003 |

Session-start hook re-injects open beads each session.

---

## 4 · Report card

From `.claude/evals/results.md` (4 tasks: explicit, implicit, contextual, negative):

> **Average hops: 2.0** · **Wrong-route rate: 0.0%** · **cost_usd: 0.022767**

Targets met (≤2 hops, wrong-route < 5%).

---

## 5 · Repo link

https://github.com/kitili/Ticketing-  
Committed: `CLAUDE.md`, `.claude/` (hooks, settings, skills, evals), `.beads/`, `docs/L2`+`L3`.  
**Not** committed: `.env`.

---

## 3-line reflection

1. Sensors now **mechanically block** force-push to main, `.env` commits, and fat `CLAUDE.md` — that used to be discipline-only.  
2. Eval result: **2.0 avg hops**, **0% wrong-route**, cost_usd **0.022767**.  
3. Next month: catch **live Supabase status writes** from the agent without an Ops Manager ask — today’s harness still only gates local git/docs.
