import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyWebhook, type StripeEnv } from "@/lib/stripe.server";
import { enqueueEmail } from "@/server/email.server";
import {
  recordLedgerEvent,
  resolveSubscription,
  creatorPlatformFeePct,
  fromMinor,
  toIso,
} from "@/server/ledger.server";


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

/** Successful renewal or first charge: write the earnings ledger row. */
async function handleInvoicePaid(invoice: any, env: StripeEnv, eventId: string) {
  const stripeSubId =
    invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null;
  const sub = await resolveSubscription(stripeSubId, env);
  const gross = fromMinor(invoice.amount_paid ?? invoice.total);
  const feePct = await creatorPlatformFeePct(sub?.creator_id);
  const platformFee = Number(((gross * feePct) / 100).toFixed(2));
  const line = invoice.lines?.data?.[0];

  await recordLedgerEvent({
    environment: env,
    kind: "payment",
    status: "succeeded",
    user_id: sub?.user_id ?? null,
    creator_id: sub?.creator_id ?? null,
    tier_id: sub?.tier_id ?? null,
    subscription_id: sub?.id ?? null,
    stripe_event_id: eventId,
    stripe_invoice_id: invoice.id ?? null,
    stripe_charge_id: invoice.charge ?? null,
    stripe_subscription_id: stripeSubId,
    currency: invoice.currency ?? "usd",
    gross_amount: gross,
    platform_fee: platformFee,
    period_start: toIso(line?.period?.start),
    period_end: toIso(line?.period?.end),
    occurred_at: toIso(invoice.created) ?? new Date().toISOString(),
  });

  // A successful charge clears any dunning state.
  if (sub?.id) {
    await supabaseAdmin
      .from("subscriptions")
      .update({ payment_failed_at: null, payment_retry_count: 0, updated_at: new Date().toISOString() })
      .eq("id", sub.id);
  }

  if (sub?.creator_id) {
    const { data: creator } = await supabaseAdmin
      .from("creator_profiles")
      .select("user_id, display_name")
      .eq("id", sub.creator_id)
      .maybeSingle();
    if (creator?.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: creator.user_id,
        type: "payment_received",
        title: "Payment received",
        body: `${invoice.currency?.toUpperCase() ?? "USD"} ${gross.toFixed(2)} from a supporter renewal.`,
        link: "/dashboard/payouts",
      });
    }
  }
}

/** Failed charge: record it, mark the subscription past_due and start dunning. */
async function handleInvoiceFailed(invoice: any, env: StripeEnv, eventId: string) {
  const stripeSubId =
    invoice.subscription ?? invoice.parent?.subscription_details?.subscription ?? null;
  const sub = await resolveSubscription(stripeSubId, env);
  const gross = fromMinor(invoice.amount_due ?? invoice.total);
  const reason =
    invoice.last_finalization_error?.message ??
    invoice.charge_failure_message ??
    "Card was declined";

  await recordLedgerEvent({
    environment: env,
    kind: "payment",
    status: "failed",
    user_id: sub?.user_id ?? null,
    creator_id: sub?.creator_id ?? null,
    tier_id: sub?.tier_id ?? null,
    subscription_id: sub?.id ?? null,
    stripe_event_id: eventId,
    stripe_invoice_id: invoice.id ?? null,
    stripe_subscription_id: stripeSubId,
    currency: invoice.currency ?? "usd",
    gross_amount: gross,
    failure_reason: reason,
    occurred_at: toIso(invoice.created) ?? new Date().toISOString(),
  });

  if (!sub?.id) return;

  const { data: current } = await supabaseAdmin
    .from("subscriptions")
    .select("payment_retry_count, payment_failed_at")
    .eq("id", sub.id)
    .maybeSingle();
  const attempt = (current?.payment_retry_count ?? 0) + 1;

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "past_due",
      payment_failed_at: current?.payment_failed_at ?? new Date().toISOString(),
      payment_retry_count: attempt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("user_id", sub.user_id)
    .maybeSingle();

  if (profile?.email) {
    await enqueueEmail({
      to: profile.email,
      subject: "Your Printreon payment didn't go through",
      html: `<p>Hi ${profile.full_name ?? "there"},</p>
<p>We couldn't take your latest membership payment (${reason}). Your access stays
active while we retry, but it will be paused if payment isn't updated within 7 days.</p>
<p><a href="https://printreon.com/me/subscriptions">Update your payment method</a></p>
<p>— The Printreon team</p>`,
    });
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: sub.user_id,
    type: "payment_failed",
    title: "Payment failed",
    body: `${reason}. Update your card to keep your membership.`,
    link: "/me/subscriptions",
  });
}

/** Refund or dispute: write a reversing ledger row. */
async function handleReversal(
  charge: any,
  env: StripeEnv,
  eventId: string,
  kind: "refund" | "dispute"
) {
  const stripeSubId = charge.subscription ?? charge.invoice_subscription ?? null;
  const sub = await resolveSubscription(stripeSubId, env);
  const amount =
    kind === "refund" ? fromMinor(charge.amount_refunded ?? charge.amount) : fromMinor(charge.amount);

  await recordLedgerEvent({
    environment: env,
    kind,
    status: "reversed",
    user_id: sub?.user_id ?? null,
    creator_id: sub?.creator_id ?? null,
    tier_id: sub?.tier_id ?? null,
    subscription_id: sub?.id ?? null,
    stripe_event_id: eventId,
    stripe_charge_id: charge.id ?? charge.charge ?? null,
    stripe_subscription_id: stripeSubId,
    currency: charge.currency ?? "usd",
    gross_amount: -Math.abs(amount),
    failure_reason: kind === "dispute" ? (charge.reason ?? "disputed") : null,
  });

  if (sub?.creator_id) {
    const { data: creator } = await supabaseAdmin
      .from("creator_profiles")
      .select("user_id")
      .eq("id", sub.creator_id)
      .maybeSingle();
    if (creator?.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: creator.user_id,
        type: kind === "refund" ? "payment_refunded" : "payment_disputed",
        title: kind === "refund" ? "A payment was refunded" : "A payment was disputed",
        body: `${Math.abs(amount).toFixed(2)} ${(charge.currency ?? "usd").toUpperCase()} has been deducted from your balance.`,
        link: "/dashboard/payouts",
      });
    }
  }
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
          const eventId = (event as any).id ?? null;
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
            case "invoice.payment_succeeded":
            case "invoice.paid":
              await handleInvoicePaid(event.data.object, env, eventId);
              break;
            case "invoice.payment_failed":
              await handleInvoiceFailed(event.data.object, env, eventId);
              break;
            case "charge.refunded":
              await handleReversal(event.data.object, env, eventId, "refund");
              break;
            case "charge.dispute.created":
              await handleReversal(event.data.object, env, eventId, "dispute");
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
