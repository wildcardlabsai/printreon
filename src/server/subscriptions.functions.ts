import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CancelInput = z.object({ subscriptionId: z.string().uuid() });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CancelInput.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, status")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (error || !sub) throw new Error("Subscription not found");
    if (sub.user_id !== userId) throw new Error("Not allowed");

    // TODO: when Stripe is enabled, also cancel at period end via Stripe API.
    const { error: upErr } = await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true, status: "canceled" })
      .eq("id", sub.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

const ResumeInput = z.object({ subscriptionId: z.string().uuid() });
export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ResumeInput.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!sub || sub.user_id !== userId) throw new Error("Not allowed");
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: false, status: "active" })
      .eq("id", sub.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
