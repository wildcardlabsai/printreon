import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, type StripeEnv } from "@/lib/stripe.server";

const EnvSchema = z.enum(["sandbox", "live"]);

async function getCreatorForUser(userId: string) {
  const { data } = await supabaseAdmin
    .from("creator_profiles")
    .select("id, user_id, display_name, slug, connected_account_id, payout_status")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

const StartInput = z.object({
  environment: EnvSchema,
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});

export const startConnectOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => StartInput.parse(d))
  .handler(async ({ data, context }) => {
    const creator = await getCreatorForUser(context.userId);
    if (!creator) throw new Error("Create your creator profile first.");

    const stripe = createStripeClient(data.environment);

    let accountId = creator.connected_account_id;
    if (!accountId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("user_id", context.userId)
        .maybeSingle();

      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: "individual",
        ...(profile?.email && { email: profile.email }),
        metadata: { creatorId: creator.id, userId: context.userId },
      });
      accountId = account.id;
      await supabaseAdmin
        .from("creator_profiles")
        .update({ connected_account_id: accountId, payout_status: "pending" })
        .eq("id", creator.id);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: data.refreshUrl,
      return_url: data.returnUrl,
      type: "account_onboarding",
    });

    return { url: link.url };
  });

const StatusInput = z.object({ environment: EnvSchema });

export const refreshConnectStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const creator = await getCreatorForUser(context.userId);
    if (!creator?.connected_account_id) return { status: "not_setup" as const };

    const stripe = createStripeClient(data.environment);
    const acct = await stripe.accounts.retrieve(creator.connected_account_id);

    const status =
      acct.charges_enabled && acct.payouts_enabled
        ? "active"
        : acct.details_submitted
          ? "pending"
          : "incomplete";

    await supabaseAdmin
      .from("creator_profiles")
      .update({ payout_status: status })
      .eq("id", creator.id);

    return {
      status,
      chargesEnabled: acct.charges_enabled,
      payoutsEnabled: acct.payouts_enabled,
      detailsSubmitted: acct.details_submitted,
      requirements: acct.requirements?.currently_due ?? [],
    };
  });

export const openExpressDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const creator = await getCreatorForUser(context.userId);
    if (!creator?.connected_account_id) throw new Error("No connected account.");
    const stripe = createStripeClient(data.environment);
    const link = await stripe.accounts.createLoginLink(creator.connected_account_id);
    return { url: link.url };
  });

/** Real payout history from the creator's connected Stripe account. */
export const listConnectPayouts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => StatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const creator = await getCreatorForUser(context.userId);
    if (!creator?.connected_account_id) return { payouts: [], available: 0, pending: 0, currency: "usd" };

    const stripe = createStripeClient(data.environment);
    const account = creator.connected_account_id;

    try {
      const [list, balance] = await Promise.all([
        stripe.payouts.list({ limit: 20 }, { stripeAccount: account }),
        stripe.balance.retrieve({}, { stripeAccount: account }),
      ]);

      const sum = (arr: { amount: number }[] | undefined) =>
        (arr ?? []).reduce((a, b) => a + b.amount, 0) / 100;

      return {
        currency: balance.available?.[0]?.currency ?? "usd",
        available: sum(balance.available as any),
        pending: sum(balance.pending as any),
        payouts: list.data.map((p) => ({
          id: p.id,
          amount: p.amount / 100,
          currency: p.currency,
          status: p.status,
          arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
          created: new Date(p.created * 1000).toISOString(),
          description: p.description ?? null,
        })),
      };
    } catch (e: any) {
      throw new Error(e?.message ?? "Could not load payout history");
    }
  });
