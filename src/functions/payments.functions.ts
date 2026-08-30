import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

const EnvSchema = z.enum(["sandbox", "live"]);

/**
 * Lazily ensure a Stripe Product + Price exists for a creator tier.
 * Caches the Stripe price id on creator_tiers.stripe_price_id.
 */
async function ensureStripePriceForTier(env: StripeEnv, tierId: string): Promise<string> {
  const { data: tier, error } = await supabaseAdmin
    .from("creator_tiers")
    .select(
      "id, name, description, price, currency, stripe_price_id, creator_id, billing_interval"
    )
    .eq("id", tierId)
    .maybeSingle();
  if (error || !tier) throw new Error("Tier not found");

  if (tier.stripe_price_id) return tier.stripe_price_id;

  const stripe = createStripeClient(env);
  const product = await stripe.products.create({
    name: `Printreon: ${tier.name}`,
    description: tier.description ?? undefined,
    metadata: { tier_id: tier.id, creator_id: tier.creator_id },
  });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: Math.round(Number(tier.price) * 100),
    currency: (tier.currency ?? "USD").toLowerCase(),
    recurring: { interval: tier.billing_interval === "year" ? "year" : "month" },
    metadata: { tier_id: tier.id },
  });

  await supabaseAdmin
    .from("creator_tiers")
    .update({ stripe_price_id: price.id })
    .eq("id", tier.id);

  return price.id;
}

const CheckoutInput = z.object({
  tierId: z.string().uuid(),
  returnUrl: z.string().url(),
  environment: EnvSchema,
});

export const createTierCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CheckoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;

    // Block duplicate active sub for this tier.
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("user_id", userId)
      .eq("tier_id", data.tierId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing && ["active", "trialing", "past_due"].includes(existing.status)) {
      throw new Error("You already have an active subscription to this tier.");
    }

    const { data: tier } = await supabaseAdmin
      .from("creator_tiers")
      .select("id, creator_id")
      .eq("id", data.tierId)
      .maybeSingle();
    if (!tier) throw new Error("Tier not found");

    const { data: creatorProfile } = await supabaseAdmin
      .from("creator_profiles")
      .select("connected_account_id, payout_status, platform_fee_percentage")
      .eq("id", tier.creator_id)
      .maybeSingle();

    const stripePriceId = await ensureStripePriceForTier(data.environment, data.tierId);

    // Get user email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", userId)
      .maybeSingle();

    const stripe = createStripeClient(data.environment);
    const feePct = Number(creatorProfile?.platform_fee_percentage ?? 10);
    const useConnect =
      creatorProfile?.connected_account_id && creatorProfile?.payout_status === "active";

    try {
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePriceId, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        ...(profile?.email && { customer_email: profile.email }),
        metadata: { userId, tierId: data.tierId, creatorId: tier.creator_id },
        subscription_data: {
          metadata: { userId, tierId: data.tierId, creatorId: tier.creator_id },
          ...(useConnect && {
            application_fee_percent: feePct,
            transfer_data: { destination: creatorProfile!.connected_account_id! },
          }),
        },
      });
      if (!session.client_secret) throw new Error("Stripe did not return a client secret");
      return { clientSecret: session.client_secret };
    } catch (e: any) {
      console.error("[checkout] stripe error:", e?.message ?? e);
      throw new Error(e?.message ?? "Could not start checkout");
    }
  });

const PortalInput = z.object({
  returnUrl: z.string().url(),
  environment: EnvSchema,
});

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PortalInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) throw new Error("No billing account found yet — subscribe first.");

    const stripe = createStripeClient(data.environment);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: data.returnUrl,
    });
    return { url: portal.url };
  });
