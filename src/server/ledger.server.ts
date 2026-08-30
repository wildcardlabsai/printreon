// Server-only earnings ledger helpers.
//
// Every row in `payment_events` originates from a signature-verified Stripe
// webhook (or an admin action recorded server-side). Creator payouts, admin
// payment reporting and revenue analytics all read from here rather than
// inferring money from the `subscriptions` table.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { StripeEnv } from "@/lib/stripe.server";

export type LedgerKind = "payment" | "refund" | "dispute" | "payout_adjustment";
export type LedgerStatus = "succeeded" | "failed" | "pending" | "reversed";

export interface LedgerRow {
  environment: StripeEnv;
  kind: LedgerKind;
  status: LedgerStatus;
  user_id?: string | null;
  creator_id?: string | null;
  tier_id?: string | null;
  subscription_id?: string | null;
  stripe_event_id?: string | null;
  stripe_invoice_id?: string | null;
  stripe_charge_id?: string | null;
  stripe_subscription_id?: string | null;
  currency?: string;
  gross_amount: number;
  stripe_fee?: number;
  platform_fee?: number;
  net_amount?: number;
  period_start?: string | null;
  period_end?: string | null;
  failure_reason?: string | null;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
}

/** Stripe amounts are minor units; the ledger stores decimal currency. */
export function fromMinor(amount: number | null | undefined): number {
  return Math.round((amount ?? 0)) / 100;
}

export function toIso(unixSeconds: number | null | undefined): string | null {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

/**
 * Inserts a ledger row. Duplicate Stripe events are ignored via the unique
 * index on stripe_event_id, so webhook retries stay idempotent.
 */
export async function recordLedgerEvent(row: LedgerRow): Promise<void> {
  const gross = row.gross_amount ?? 0;
  const stripeFee = row.stripe_fee ?? 0;
  const platformFee = row.platform_fee ?? 0;
  const net = row.net_amount ?? Number((gross - stripeFee - platformFee).toFixed(2));

  const payload = {
    ...row,
    currency: row.currency ?? "usd",
    stripe_fee: stripeFee,
    platform_fee: platformFee,
    net_amount: net,
    metadata: (row.metadata ?? {}) as never,
    occurred_at: row.occurred_at ?? new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("payment_events").insert(payload);


  // 23505 = duplicate event id; a webhook replay, not an error worth throwing.
  if (error && error.code !== "23505") {
    console.error("[ledger] insert failed", error.message);
    throw new Error(error.message);
  }
}

/**
 * Resolves the local subscription (and its creator/tier) from a Stripe
 * subscription id so ledger rows can be attributed without extra API calls.
 */
export async function resolveSubscription(
  stripeSubscriptionId: string | null | undefined,
  env: StripeEnv
) {
  if (!stripeSubscriptionId) return null;
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, creator_id, tier_id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .eq("environment", env)
    .maybeSingle();
  return data ?? null;
}

/** Platform fee for a creator, defaulting to the platform standard. */
export async function creatorPlatformFeePct(creatorId: string | null | undefined): Promise<number> {
  if (!creatorId) return 10;
  const { data } = await supabaseAdmin
    .from("creator_profiles")
    .select("platform_fee_percentage")
    .eq("id", creatorId)
    .maybeSingle();
  return Number(data?.platform_fee_percentage ?? 10);
}
