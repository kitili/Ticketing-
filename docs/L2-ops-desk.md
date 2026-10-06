---
type: L2
last_verified: 2026-10-06
owner: kitili
---

# L2 — Ops Desk folder router

Short map of where work lives. For policy detail, hop once more to L3.

## App surface
- `public/` — static frontend (Netlify publish dir)
- `public/js/api.js` — online + offline facade
- `supabase/schema.sql` — DB schema

## Agent surface
- `inbox/*.json` — new tickets (hook trigger)
- `runs/` — combined orchestrator outputs (gitignored)
- `evals/` — intake + harness check reports
- `.claude/skills/` — one skill per sub-agent
- `scripts/run-orchestrator.sh` — entrypoint for `/ticket-intake`

## Next hop (L3)
- Autonomy dial, irreversible risks, slider: `docs/L3-autonomy.md`
- Guardrail one-liner also in repo root `guardrail.md`
