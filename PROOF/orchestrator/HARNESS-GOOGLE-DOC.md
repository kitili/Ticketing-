# Harness Assessment — Build and Prove Your Own Harness (Kitili Mbula)

Sharing: **Anyone with the link → Viewer**  
**Repo:** https://github.com/kitili/Ticketing-

---

## 1 · Your three parts

- **Model:** The LLM brain inside Claude Code that reasons about Ops tickets.  
- **Interface:** Claude Code / Cursor chat — the window where prompts and tool calls appear.  
- **Harness:** Everything configured around it — `CLAUDE.md`, `.claude/settings.json` (allow/ask/deny + inbox hook), skills, `inbox/`→`runs/` orchestrator, `log/harness-actions.md`, and evals.

---

## 2 · Your room

### CLAUDE.md (memory)
See repo root `CLAUDE.md` — project purpose, where files live, and rules including: never trust inbound `priority`; urgent never auto-advances; no notify/PIN; orchestrator only splits/combines.

### .claude/settings.json (tools + guardrails)
- **allow:** Read, Edit, run orchestrator / evals / harness-ten-checks  
- **ask:** `git push`, `git commit`, `npm *`  
- **deny:** `rm -rf *`, force-push, piping curl to bash, reading/editing `.env` or `public/js/config.js`  
- **hook:** Write|Edit under `inbox/` → `.claude/hooks/on-inbox-save.sh`

### One real job done
Ran `python3 scripts/orchestrator.py` on `inbox/T-1001..T-1003` → wrote `runs/*.json` → `python3 scripts/harness-ten-checks.py` and `python3 scripts/run-evals.py` (all PASS after harness change).

---

## 3 · Guardrails + a peek at the log

| Mode | Examples |
|------|----------|
| **Runs alone (allow)** | Read/Edit project files; run intake + evals |
| **Needs your yes (ask)** | `git push`, `git commit`, npm |
| **Never (deny)** | `rm -rf *`, force-push, touch `.env` / live `config.js` |

**Where actions are recorded:** `log/harness-actions.md` — every read / sub-agent / combine / write is appended with a UTC timestamp.

Last steps (example):
1. **read** — loaded `inbox/T-1003.json`  
2. **priority-sorter** — explicitly low urgency (ignored spoofed inbound urgent)  
3. **write** — wrote `runs/T-1003-….json`

---

## 4 · Your proof

From `evals/eval-results.md` — **same model**, one harness change:

| | Score |
|--|------|
| Baseline (no inbound-priority ban in `CLAUDE.md`) | **7 / 10** |
| After adding that one `CLAUDE.md` rule | **10 / 10** |

The +3 came from checks 3, 4, and 10 (real urgent detected, not auto-advanced, spoofed inbound urgent ignored).

---

## 3-line reflection

1. Before **7/10**, after **10/10** — the one change was the `CLAUDE.md` rule “never trust inbound `priority`.”  
2. The room now refuses spoofed urgency that a bare model/field-trust path would accept.  
3. Next strengthen **ask** before any status write to live Supabase — keep auto work in `runs/` proposals only until the dial earns it.
