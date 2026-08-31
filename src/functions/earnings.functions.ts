import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EarningsMonth = { month: string; gross: number; platformFee: number; stripeFee: number; net: number };

export type EarningsSummary = {
  currency: string;
  thisMonth: number;
  lastMonth: number;
  lifetime: number;
  pending: number;
  gross: number;
  platformFee: number;
  stripeFee: number;
  failedCount: number;
  refundedCount: number;
  months: EarningsMonth[];
  daily: { date: string; net: number }[];
};

export type EarningsTransaction = {
  id: string;
  occurredAt: string;
  kind: string;
  status: string;
  member: string;
  tier: string;
  currency: string;
  gross: number;
  platformFee: number;
  stripeFee: number;
  net: number;
  failureReason: string | null;
};

const SUCCESS = new Set(["succeeded", "paid", "active", "complete", "completed"]);

async function ownCreatorId(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

const monthKey = (iso: string) => new Date(iso).toISOString().slice(0, 7);

/** Server-side rollups of the signed-in creator's own payment events. */
export const creatorEarningsSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EarningsSummary> => {
    const empty: EarningsSummary = {
      currency: "usd",
      thisMonth: 0,
      lastMonth: 0,
      lifetime: 0,
      pending: 0,
      gross: 0,
      platformFee: 0,
      stripeFee: 0,
      failedCount: 0,
      refundedCount: 0,
      months: [],
      daily: [],
    };

    const creatorId = await ownCreatorId(context.supabase, context.userId);
    if (!creatorId) return empty;

    const { data, error } = await context.supabase
      .from("payment_events")
      .select("kind, status, currency, gross_amount, platform_fee, stripe_fee, net_amount, occurred_at, period_end")
      .eq("creator_id", creatorId)
      .order("occurred_at", { ascending: false })
      .limit(5000);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as any[];
    if (rows.length === 0) return empty;

    const now = new Date();
    const thisKey = now.toISOString().slice(0, 7);
    const lastKey = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);

    const byMonth = new Map<string, EarningsMonth>();
    const byDay = new Map<string, number>();
    let gross = 0;
    let platformFee = 0;
    let stripeFee = 0;
    let lifetime = 0;
    let failedCount = 0;
    let refundedCount = 0;
    let pending = 0;
    let currency = "usd";

    for (const r of rows) {
      const status = String(r.status ?? "");
      const kind = String(r.kind ?? "");
      currency = r.currency ?? currency;

      if (status === "failed" || kind.includes("failed")) {
        failedCount++;
        continue;
      }
      const isRefund = kind.includes("refund") || status === "refunded";
      if (isRefund) refundedCount++;

      const sign = isRefund ? -1 : 1;
      const g = sign * Math.abs(Number(r.gross_amount ?? 0));
      const pf = sign * Math.abs(Number(r.platform_fee ?? 0));
      const sf = sign * Math.abs(Number(r.stripe_fee ?? 0));
      const net = sign * Math.abs(Number(r.net_amount ?? 0));

      if (!SUCCESS.has(status) && !isRefund) continue;

      gross += g;
      platformFee += pf;
      stripeFee += sf;
      lifetime += net;

      const mk = monthKey(r.occurred_at);
      const cur = byMonth.get(mk) ?? { month: mk, gross: 0, platformFee: 0, stripeFee: 0, net: 0 };
      cur.gross += g;
      cur.platformFee += pf;
      cur.stripeFee += sf;
      cur.net += net;
      byMonth.set(mk, cur);

      const dk = new Date(r.occurred_at).toISOString().slice(0, 10);
      byDay.set(dk, (byDay.get(dk) ?? 0) + net);

      // Earnings from the current billing period that Stripe has not paid out yet.
      if (mk === thisKey) pending += net;
    }

    const months = Array.from(byMonth.values()).sort((a, b) => (a.month < b.month ? -1 : 1)).slice(-12);

    return {
      currency,
      thisMonth: byMonth.get(thisKey)?.net ?? 0,
      lastMonth: byMonth.get(lastKey)?.net ?? 0,
      lifetime,
      pending,
      gross,
      platformFee,
      stripeFee,
      failedCount,
      refundedCount,
      months,
      daily: Array.from(byDay.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, net]) => ({ date, net })),
    };
  });

const TxInput = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.enum(["all", "paid", "refunded", "failed"]).default("all"),
  limit: z.number().int().min(1).max(500).default(100),
  offset: z.number().int().min(0).default(0),
});

/** Paged transaction ledger for the signed-in creator. */
export const creatorEarningsTransactions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => TxInput.parse(d ?? {}))
  .handler(async ({ data, context }): Promise<{ items: EarningsTransaction[]; total: number }> => {
    const creatorId = await ownCreatorId(context.supabase, context.userId);
    if (!creatorId) return { items: [], total: 0 };

    let q = context.supabase
      .from("payment_events")
      .select(
        "id, kind, status, currency, gross_amount, platform_fee, stripe_fee, net_amount, occurred_at, failure_reason, user_id, tier_id, creator_tiers(name)",
        { count: "exact" },
      )
      .eq("creator_id", creatorId);

    if (data.from) q = q.gte("occurred_at", new Date(data.from).toISOString());
    if (data.to) q = q.lte("occurred_at", new Date(`${data.to}T23:59:59.999Z`).toISOString());
    if (data.status === "failed") q = q.eq("status", "failed");
    if (data.status === "refunded") q = q.like("kind", "%refund%");
    if (data.status === "paid") q = q.neq("status", "failed");

    const { data: rows, error, count } = await q
      .order("occurred_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as any[];
    const userIds = Array.from(new Set(list.map((r) => r.user_id).filter(Boolean)));
    const names = new Map<string, string>();
    if (userIds.length) {
      // Profiles are owner/admin readable only, so resolve supporter names
      // server-side after the creator ownership check above.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      for (const p of (profiles ?? []) as any[]) {
        names.set(p.user_id, p.full_name || p.email || "Member");
      }
    }

    return {
      total: count ?? list.length,
      items: list.map((r) => ({
        id: r.id,
        occurredAt: r.occurred_at,
        kind: r.kind,
        status: r.status,
        member: (r.user_id && names.get(r.user_id)) || "Member",
        tier: r.creator_tiers?.name ?? "—",
        currency: r.currency ?? "usd",
        gross: Number(r.gross_amount ?? 0),
        platformFee: Number(r.platform_fee ?? 0),
        stripeFee: Number(r.stripe_fee ?? 0),
        net: Number(r.net_amount ?? 0),
        failureReason: r.failure_reason ?? null,
      })),
    };
  });
