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

/** Email deliverability feed over the outbox. */
export const adminListEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ status: z.enum(["all", "pending", "sent", "failed"]).default("all") }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("email_outbox")
      .select("id, to_email, subject, status, error, created_at, sent_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: counts } = await supabaseAdmin.from("email_outbox").select("status");
    const tally = { total: 0, sent: 0, failed: 0, pending: 0 } as Record<string, number>;
    for (const r of counts ?? []) {
      tally.total += 1;
      tally[(r as any).status] = (tally[(r as any).status] ?? 0) + 1;
    }
    return { rows: rows ?? [], tally };
  });

/** Retry a failed outbox email. */
export const adminRetryEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ emailId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row } = await supabaseAdmin
      .from("email_outbox")
      .select("id, to_email, subject, html")
      .eq("id", data.emailId)
      .maybeSingle();
    if (!row) throw new Error("Email not found");

    const { sendOutboxRow } = await import("@/server/email.server");
    try {
      await sendOutboxRow({ to: row.to_email, subject: row.subject, html: row.html });
      await supabaseAdmin
        .from("email_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
        .eq("id", row.id);
      return { ok: true };
    } catch (e: any) {
      const message = String(e?.message ?? e);
      await supabaseAdmin
        .from("email_outbox")
        .update({ status: "failed", error: message })
        .eq("id", row.id);
      throw new Error(message);
    }
  });

/** MRR / ARR / churn / LTV computed from live subscriptions + the payment ledger. */
export const adminRevenueMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, status, comped, created_at, updated_at, current_period_end, creator_tiers(price, currency, billing_interval)"
      );
    const all = (subs ?? []) as any[];

    const activeSubs = all.filter((s) => ["active", "trialing"].includes(s.status) && !s.comped);
    const monthlyValue = (s: any) => {
      const price = Number(s.creator_tiers?.price ?? 0);
      return s.creator_tiers?.billing_interval === "year" ? price / 12 : price;
    };
    const mrr = activeSubs.reduce((a, s) => a + monthlyValue(s), 0);
    const arpu = activeSubs.length ? mrr / activeSubs.length : 0;

    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const churnedLast30 = all.filter(
      (s) =>
        ["canceled", "expired"].includes(s.status) && new Date(s.updated_at).getTime() >= monthAgo
    ).length;
    const baseline = activeSubs.length + churnedLast30;
    const churnRate = baseline ? churnedLast30 / baseline : 0;
    const ltv = churnRate > 0 ? arpu / churnRate : arpu * 24;

    const { data: events } = await supabaseAdmin
      .from("payment_events")
      .select("gross_amount, platform_fee, net_amount, status, occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(2000);

    const byMonth = new Map<string, { gross: number; fees: number }>();
    for (const e of (events ?? []) as any[]) {
      const key = new Date(e.occurred_at).toISOString().slice(0, 7);
      const cur = byMonth.get(key) ?? { gross: 0, fees: 0 };
      cur.gross += Number(e.gross_amount);
      cur.fees += Number(e.platform_fee);
      byMonth.set(key, cur);
    }
    const series = Array.from(byMonth.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .slice(-12)
      .map(([month, v]) => ({ month, gross: v.gross, fees: v.fees }));

    return {
      mrr,
      arr: mrr * 12,
      arpu,
      churnRate,
      ltv,
      activeCount: activeSubs.length,
      compedCount: all.filter((s) => s.comped && s.status === "active").length,
      trialingCount: all.filter((s) => s.status === "trialing").length,
      churnedLast30,
      series,
    };
  });

/**
 * Go-live readiness: which payment credentials exist, which Stripe
 * environment is active, whether webhooks have ever been verified, and
 * whether the scheduled jobs and payout accounts are in place.
 */
export const adminStripeReadiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const has = (key: string) => Boolean(process.env[key]);
    const keys = {
      sandboxApiKey: has("STRIPE_SANDBOX_API_KEY"),
      liveApiKey: has("STRIPE_LIVE_API_KEY"),
      sandboxWebhookSecret: has("PAYMENTS_SANDBOX_WEBHOOK_SECRET"),
      liveWebhookSecret: has("PAYMENTS_LIVE_WEBHOOK_SECRET"),
      lovableApiKey: has("LOVABLE_API_KEY"),
      cronToken: has("CRON_JOB_TOKEN") || has("CRON_SECRET"),
      emailApiKey: has("RESEND_API_KEY"),
    };

    const lastEvent = async (env: "sandbox" | "live") => {
      const { data } = await supabaseAdmin
        .from("payment_events")
        .select("occurred_at, kind, stripe_event_id")
        .eq("environment", env)
        .not("stripe_event_id", "is", null)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data ?? null;
    };

    const [sandboxEvent, liveEvent] = await Promise.all([lastEvent("sandbox"), lastEvent("live")]);

    const { count: liveSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("environment", "live");

    const { data: tiers } = await supabaseAdmin
      .from("creator_tiers")
      .select("id, stripe_price_id, is_active");
    const activeTiers = (tiers ?? []).filter((t) => t.is_active !== false);
    const tiersWithPrice = activeTiers.filter((t) => Boolean(t.stripe_price_id)).length;

    const { data: creators } = await supabaseAdmin
      .from("creator_profiles")
      .select("id, connected_account_id, payout_status, is_published");
    const published = (creators ?? []).filter((c) => c.is_published);
    const payoutReady = published.filter((c) => c.payout_status === "active").length;

    let jobs: any[] | null = null;
    try {
      const res = await supabaseAdmin.rpc("admin_cron_jobs");
      jobs = (res.data as any[] | null) ?? null;
    } catch {
      jobs = null;
    }


    return {
      keys,
      liveReady: keys.liveApiKey && keys.liveWebhookSecret,
      sandboxEvent,
      liveEvent,
      liveSubscriptions: liveSubs ?? 0,
      tiers: { total: activeTiers.length, withStripePrice: tiersWithPrice },
      payouts: { publishedCreators: published.length, payoutReady },
      cronJobs: jobs ?? null,
    };
  });
