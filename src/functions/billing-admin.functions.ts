import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Admin only");
}

async function logAdminAction(
  adminUserId: string,
  action: string,
  targetId: string,
  metadata: Record<string, unknown>
) {
  await supabaseAdmin.from("admin_activity_log").insert({
    admin_user_id: adminUserId,
    action,
    target_type: "subscription",
    target_id: targetId,
    metadata: metadata as never,
  });
}

/** Refunds the latest charge on a subscription through Stripe. */
export const adminRefundSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ subscriptionId: z.string().uuid(), reason: z.string().max(300).optional() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, environment")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!sub?.stripe_subscription_id) throw new Error("No Stripe subscription on this membership");

    const { createStripeClient } = await import("@/lib/stripe.server");
    const stripe = createStripeClient(sub.environment as "sandbox" | "live");

    const invoices = await stripe.invoices.list({
      subscription: sub.stripe_subscription_id,
      limit: 1,
    });
    const latest: any = invoices.data[0];
    const chargeId = latest?.charge ?? latest?.payments?.data?.[0]?.payment?.charge;
    if (!chargeId) throw new Error("No charge available to refund");

    const refund = await stripe.refunds.create({ charge: chargeId as string });
    await logAdminAction(context.userId, "refund_subscription", sub.id, {
      refund_id: refund.id,
      reason: data.reason ?? null,
    });
    // The charge.refunded webhook writes the reversing ledger row.
    return { ok: true, refundId: refund.id };
  });

/** Cancels a membership — immediately, or at the end of the paid period. */
export const adminCancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ subscriptionId: z.string().uuid(), immediate: z.boolean().default(false) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_subscription_id, environment")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (!sub) throw new Error("Membership not found");

    if (sub.stripe_subscription_id) {
      const { createStripeClient } = await import("@/lib/stripe.server");
      const stripe = createStripeClient(sub.environment as "sandbox" | "live");
      if (data.immediate) {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      } else {
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }
    }

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: data.immediate ? "canceled" : "active",
        cancel_at_period_end: !data.immediate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    await logAdminAction(context.userId, "cancel_subscription", sub.id, {
      immediate: data.immediate,
    });
    return { ok: true };
  });

/** Grants comped (free) access to a creator's tier for N months. */
export const adminCompAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        email: z.string().email(),
        tierId: z.string().uuid(),
        months: z.number().int().min(1).max(24).default(1),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();
    if (!prof) throw new Error("No user with that email");

    const { data: tier } = await supabaseAdmin
      .from("creator_tiers")
      .select("id, creator_id")
      .eq("id", data.tierId)
      .maybeSingle();
    if (!tier) throw new Error("Tier not found");

    const end = new Date();
    end.setMonth(end.getMonth() + data.months);

    const { data: inserted, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: prof.user_id,
        creator_id: tier.creator_id,
        tier_id: tier.id,
        status: "active",
        comped: true,
        environment: "sandbox",
        current_period_start: new Date().toISOString(),
        current_period_end: end.toISOString(),
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: prof.user_id,
      type: "comped_access",
      title: "You've been granted free access",
      body: `Complimentary membership for ${data.months} month(s).`,
      link: "/me/subscriptions",
    });

    await logAdminAction(context.userId, "comp_access", inserted?.id ?? tier.id, {
      email: data.email,
      months: data.months,
    });
    return { ok: true };
  });
