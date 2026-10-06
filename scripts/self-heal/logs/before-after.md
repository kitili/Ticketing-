# Before / after — self-heal measure

| | Runs | Passes | Retries (sum) | Escalations |
|---|------:|-------:|--------------:|------------:|
| **Before** (no stored fix) | 10 | 10 | 17 | 0 |
| **After** (instructions store) | 10 | 10 | 0 | 0 |

Retries dropped by **17**; escalations dropped by **0**.

Store chosen for all three failures: **instructions** — the agent was never told the rules permanently; feedback healed one run, memory shortens the next.

