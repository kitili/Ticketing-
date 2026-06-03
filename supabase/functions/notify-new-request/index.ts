/**
 * Sends email and/or WhatsApp when a new ticket is inserted.
 *
 * Deploy: supabase functions deploy notify-new-request
 * Secrets: RESEND_API_KEY, OPS_MANAGER_EMAIL (or use settings table)
 * Optional WhatsApp (Twilio): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPS_MANAGER_PHONE
 *
 * Trigger: Database Webhook on public.requests INSERT → this function URL
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" };

async function getSetting(supabase: ReturnType<typeof createClient>, key: string) {
  const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  return data?.value?.trim() || "";
}

async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to) return { ok: false, reason: "email not configured" };

  const from = Deno.env.get("RESEND_FROM") || "Ops Desk <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Resend: " + err);
  }
  return { ok: true };
}

async function sendWhatsApp(to: string, body: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!sid || !token || !from || !to) return { ok: false, reason: "whatsapp not configured" };

  const phone = to.startsWith("whatsapp:") ? to : "whatsapp:" + to;
  const url =
    "https://api.twilio.com/2010-04-01/Accounts/" +
    sid +
    "/Messages.json";
  const params = new URLSearchParams({ From: from, To: phone, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(sid + ":" + token),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error("Twilio: " + err);
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const payload = await req.json();
    const record = payload.record || payload;
    if (!record?.id) {
      return new Response(JSON.stringify({ ok: false, error: "no record" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email =
      Deno.env.get("OPS_MANAGER_EMAIL") ||
      (await getSetting(supabase, "ops_manager_email"));
    const phone =
      Deno.env.get("OPS_MANAGER_PHONE") ||
      (await getSetting(supabase, "ops_manager_phone"));

    const subject = `[Ops Desk] New ticket ${record.id} — ${record.department}`;
    const html = `
      <h2>New ops ticket</h2>
      <p><strong>${record.id}</strong> · ${record.department}</p>
      <p><strong>${record.title}</strong></p>
      <p>From: ${record.requester_name}${record.campus ? " · " + record.campus : ""}</p>
      <p>Priority: ${record.priority || "normal"} · Category: ${record.category || "General"}</p>
      <p>${(record.details || "").replace(/</g, "&lt;")}</p>
    `;
    const smsBody =
      `New ops ticket ${record.id}\n` +
      `${record.department}: ${record.title}\n` +
      `From ${record.requester_name} · ${record.priority || "normal"} priority`;

    const results: Record<string, unknown> = {};
    if (email) results.email = await sendEmail(email, subject, html);
    if (phone) results.whatsapp = await sendWhatsApp(phone, smsBody);

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
