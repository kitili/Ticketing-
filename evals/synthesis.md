# Eval — synthesis (pieces fit)

## Checks
1. Combined priority / ack / status match each sub-agent’s output.
2. Urgent tickets are never auto-advanced in the combined result.
3. Combined result never sets `notify: true`.
4. Ack text does not contradict the sorted priority.

## Why this exists
Each sub-agent can pass alone while the merged run contradicts itself. Synthesis catches that mismatch before anything ships.
