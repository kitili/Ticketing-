# Email & WhatsApp notifications

When a new ticket is saved to Supabase (including after **offline sync**), the ops manager can get an alert.

## 1) Set contact details

In Supabase **SQL Editor** (or Table Editor → `settings`):

Default ops contact (also in `schema.sql`):

| Setting | Value |
|---------|--------|
| `ops_manager_email` | `baraka@silverleaf.co.tz` |
| `ops_manager_phone` | `+255762711796` |

To change later:

```sql
UPDATE settings SET value = 'baraka@silverleaf.co.tz' WHERE key = 'ops_manager_email';
UPDATE settings SET value = '+255762711796' WHERE key = 'ops_manager_phone';
```

Phone must be in **E.164** format (e.g. `+255…`) for WhatsApp via Twilio.

## 2) Email (Resend — free tier)

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Deploy the Edge Function (needs [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set RESEND_API_KEY=re_xxxx
supabase secrets set RESEND_FROM="Ops Desk <notify@yourdomain.com>"
supabase secrets set OPS_MANAGER_EMAIL=baraka@silverleaf.co.tz
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase functions deploy notify-new-request
```

3. Copy the function URL from the deploy output.

## 3) WhatsApp (optional — Twilio)

1. [Twilio](https://www.twilio.com) account + WhatsApp sandbox or approved sender.
2. Set secrets:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxx
supabase secrets set TWILIO_AUTH_TOKEN=xxxx
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
supabase secrets set OPS_MANAGER_PHONE=+255762711796
```

## 4) Database webhook (required)

Supabase Dashboard → **Database** → **Webhooks** → **Create**:

| Field | Value |
|--------|--------|
| Name | `notify-new-request` |
| Table | `requests` |
| Events | **Insert** |
| Type | Supabase Edge Function |
| Function | `notify-new-request` |

Or HTTP POST to your function URL if you prefer.

## When notifications fire

- **Online submit** → insert → webhook → email/WhatsApp immediately.
- **Offline submit** → queued locally → on sync → insert → same webhook.

No notification is sent until the row exists in Supabase.

## Test locally

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/notify-new-request' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"record":{"id":"REQ-001","department":"Kitchen","requester_name":"Test","title":"Test","details":"Hello","priority":"normal","category":"General"}}'
```
