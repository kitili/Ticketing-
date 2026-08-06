# Module 10 — LLM-as-judge results (Main project)

**Project:** Silverleaf Ops Ticket Desk (Ticketing-)  
**Output judged:** short user-facing status / error / success messages  
**Rubric:** `quality-rubric.md` (5 yes/no lines)

## Ten messages scored

### 1. `TypeError: Failed to fetch` (shown on My tickets before fix)
| Line | Verdict | Reason |
|------|---------|--------|
| 1 what happened | NO | Raw exception name, not plain English |
| 2 what to do | NO | No next step |
| 3 no jargon | NO | Contains TypeError |
| 4 no blame | YES | Does not blame the user |
| 5 under 20 words | YES | Short |

### 2. `Cannot reach Supabase: TypeError: Failed to fetch` (PIN hint before fix)
| L1 | L2 | L3 | L4 | L5 |
| NO | NO | NO | YES | YES |
Reason: still jargon; no fix instruction beyond naming Supabase.

### 3. `Ticket REQ-… opened.` (happy path)
| YES | YES* | YES | YES | YES |
\*Implies stay on desk / see My tickets — acceptable next step.

### 4. `Ticket … saved offline — will sync when online.`
| YES | YES | YES | YES | YES |

### 5. `Invalid manager PIN.`
| YES | NO | YES | YES | YES |
Needs “try again or ask Ops” to pass L2 — **NO on L2**.

### 6. `Offline — you can still open tickets and work from cached data.`
| YES | YES | YES | YES | YES |

### 7. `Not found (offline — open this ticket once while online).`
| YES | YES | YES | YES | YES |

### 8. After fix: `Cannot reach the server. Ticket saved offline if possible — tap Sync when back online.`
| YES | YES | YES | YES | YES |

### 9. `App failed to start: Failed to fetch` (raw)
| NO | NO | NO | YES | YES |

### 10. `Online — 2 change(s) waiting to sync.`
| YES | YES | YES | YES | YES |

## Least sure
Message 5 (`Invalid manager PIN.`) — L2 is borderline. Hand rule: must include a next action → **fail L2**.

## Hand-check agreement
Checked **20** line-verdicts (messages 1–4 × 5).  
Agreed with the judge on **19 / 20** (95%).  

One disagreement: message 3 L2 — I first wanted an explicit “View My tickets”; judge YES accepted; I kept YES after re-read.

**Hardest line:** Line 2 (must state a next action).
