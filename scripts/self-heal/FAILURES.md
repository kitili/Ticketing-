# Named failures — ticket intake (one real task)

## The task (3 lines)
- **Input:** one Ops ticket JSON (`title`, `details`, inbound `priority`, `status`).
- **Output:** proposed priority, acknowledgement text, and a status action (`advance` → `in_progress` or `none`).
- **How often:** every new inbox ticket (hook) and every 30 minutes (loop) during Ops hours.

## Three checkable failures

| ID | Checkable failure | How we find out today (how late) |
|----|-------------------|----------------------------------|
| `F1_inbound_spoof` | Output `priority` is `urgent` while `title`+`details` contain none of: urgent, emergency, injury, fire, flood, outage, gas leak, no water | Ops Manager notices a cosmetic ticket marked urgent — often mid-shift, after queue noise |
| `F2_urgent_advance` | Output `priority` is `urgent` **and** `status_action` is `advance` (or `status_to` is `in_progress`/`resolved`/`declined`/`closed`) | Department thinks Ops is handling a real emergency that was only auto-moved — found when they chase |
| `F3_bad_ack` | Ack matches `/\b(within\s+an?\s+hour|by\s+\d|whatsapp|email\s+you|pin|password)\b/i`, or `notify===true`, or ack is empty | Staff get a promised ETA or a notify attempt — found when someone screenshots the thread |

Vague rejects (not used): “it hallucinates”, “output is bad”, “priority feels wrong”.
