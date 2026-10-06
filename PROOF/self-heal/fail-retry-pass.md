# Real run: failed → retried with reason → passed

## try 0
- ok: false
- failure_id: F1_inbound_spoof
- reason: F1_inbound_spoof: priority is urgent but title+details lack urgent/emergency/outage language — do not trust inbound priority; classify from text only.

## try 1
- ok: false
- failure_id: F3_bad_ack
- reason: F3_bad_ack: ack promises a time, mentions PIN/password, or sets notify=true — rewrite ack without ETA/PIN/notify and keep notify=false.
- fed back into next act: yes (accumulated)

## try 2
- ok: true
- failure_id: none
- fed back into next act: yes (accumulated)

**Final:** ok=true retries=2 escalated=false
