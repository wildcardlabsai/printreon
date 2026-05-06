import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";
import { enqueueEmail } from "@/server/email.server";

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const meta = subscription.metadata ?? {};
  const userId = meta.userId;
  const tierId = meta.tierId;
  const creatorId = meta.creatorId;
  if (!userId) {
    console.error("[stripe webhook] missing userId in metadata", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: userId,
      tier_id: tierId,
      creator_id: creatorId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Notify subscriber + creator
  if (creatorId) {
    const { data: creator } = await supabaseAdmin
      .from("creator_profiles")
      .select("display_name, slug, user_id")
      .eq("id", creatorId)
      .maybeSingle();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.email && creator) {
      await enqueueEmail({
        to: profile.email,
        subject: `Welcome to ${creator.display_name} on Printreon`,
        html: `<p>Hi ${profile.full_name ?? ""},</p>
<p>You're now subscribed to <strong>${creator.display_name}</strong>. Enjoy your member files at
<a href="https://printreon.com/c/${creator.slug}">printreon.com/c/${creator.slug}</a>.</p>
<p>— The Printreon team</p>`,
      });
    }
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      type: "subscription_started",
      title: `Subscription active`,
      body: creator ? `You subscribed to ${creator.display_name}` : "Subscription confirmed",
      link: creator ? `/c/${creator.slug}` : null,
    });
    if (creator?.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: creator.user_id,
        type: "new_subscriber",
        title: "New subscriber 🎉",
        body: `${profile?.full_name ?? "Someone"} just subscribed to your tier.`,
        link: "/dashboard/subscribers",
      });
    }
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "customer.subscription.created":
              await handleSubscriptionCreated(event.data.object, env);
              break;
            case "customer.subscription.updated":
              await handleSubscriptionUpdated(event.data.object, env);
              break;
            case "customer.subscription.deleted":
            case "subscription.canceled":
              await handleSubscriptionDeleted(event.data.object, env);
              break;
            case "account.updated": {
              const acct = event.data.object as any;
              const status =
                acct.charges_enabled && acct.payouts_enabled
                  ? "active"
                  : acct.details_submitted
                    ? "pending"
                    : "incomplete";
              await supabaseAdmin
                .from("creator_profiles")
                .update({ payout_status: status })
                .eq("connected_account_id", acct.id);
              break;
            }
            default:
              console.log("[stripe webhook] unhandled", event.type);
          }
          return Response.json({ received: true });
        } catch (e: any) {
          console.error("[stripe webhook] error:", e?.message ?? e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
