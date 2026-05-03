import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

const EnvSchema = z.enum(["sandbox", "live"]);

const CancelInput = z.object({ subscriptionId: z.string().uuid(), environment: EnvSchema });
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CancelInput.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, stripe_subscription_id")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (error || !sub) throw new Error("Subscription not found");
    if (sub.user_id !== userId) throw new Error("Not allowed");

    if (sub.stripe_subscription_id) {
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
    }
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("id", sub.id);
    return { ok: true };
  });

const ResumeInput = z.object({ subscriptionId: z.string().uuid(), environment: EnvSchema });
export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ResumeInput.parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, stripe_subscription_id")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!sub || sub.user_id !== userId) throw new Error("Not allowed");

    if (sub.stripe_subscription_id) {
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: false });
    }
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: false, status: "active" })
      .eq("id", sub.id);
    return { ok: true };
  });
