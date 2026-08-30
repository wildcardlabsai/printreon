// Server-only email helpers backed by Resend (via Lovable connector gateway).
// Emails are queued in `email_outbox` and sent immediately when possible.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_DEFAULT = "Printreon <onboarding@resend.dev>";

export interface EnqueueEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function enqueueEmail(input: EnqueueEmailInput): Promise<void> {
  const { error: insertErr } = await supabaseAdmin.from("email_outbox").insert({
    to_email: input.to,
    subject: input.subject,
    html: input.html,
  });
  if (insertErr) {
    console.error("[email] failed to enqueue:", insertErr);
  }

  // Try sending now; failures are logged but the queue row remains for retry.
  try {
    await sendEmailNow(input);
    await supabaseAdmin
      .from("email_outbox")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("to_email", input.to)
      .eq("subject", input.subject)
      .eq("status", "pending");
  } catch (e: any) {
    console.error("[email] send failed:", e?.message ?? e);
    await supabaseAdmin
      .from("email_outbox")
      .update({ status: "failed", error: String(e?.message ?? e) })
      .eq("to_email", input.to)
      .eq("subject", input.subject)
      .eq("status", "pending");
  }
}

/** Sends an already-queued outbox row (used by admin retry). */
export async function sendOutboxRow(input: EnqueueEmailInput): Promise<void> {
  await sendEmailNow(input);
}

async function sendEmailNow(input: EnqueueEmailInput): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    throw new Error("Email not configured (LOVABLE_API_KEY or RESEND_API_KEY missing)");
  }
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: input.from ?? FROM_DEFAULT,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body}`);
  }
}
