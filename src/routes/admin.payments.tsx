import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/payments")({ component: Payments });

function Payments() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { (async () => {
    const [{ data: subs }, { data: flag }] = await Promise.all([
      supabase.from("subscriptions").select("status, creator_tiers(price, currency)"),
      supabase.from("feature_flags").select("enabled").eq("key", "stripe_payments_enabled").maybeSingle(),
    ]);
    const active = (subs ?? []).filter((s: any) => s.status === "active");
    const mrr = active.reduce((acc: number, s: any) => acc + Number(s?.creator_tiers?.price ?? 0), 0);
    const failed = (subs ?? []).filter((s: any) => s.status === "past_due" || s.status === "unpaid").length;
    setData({ stripeOn: !!flag?.enabled, mrr, active: active.length, failed, total: (subs ?? []).length });
  })(); }, []);

  if (!data) return <div className="p-8 text-ink-soft">Loading…</div>;

  return (
    <div className="p-8">
      <PageHeader title="Payments" subtitle="Stripe-ready overview" />
      {!data.stripeOn && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700">
          Stripe is not connected yet. Payment data will appear here once configured.
        </div>
      )}
      {data.total === 0 ? (
        <EmptyState title="No subscription data yet." description="Once memberships are active, MRR and payouts will appear here." />
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard label="Estimated MRR" value={`£${data.mrr.toFixed(2)}`} />
          <StatCard label="Active subscriptions" value={data.active} />
          <StatCard label="Failed payments" value={data.failed} />
          <StatCard label="Total subscriptions" value={data.total} />
        </div>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-3 text-sm text-ink-soft">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="font-semibold text-ink mb-1">Creator earnings</div>
          Calculated per creator once payouts are processed.
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="font-semibold text-ink mb-1">Platform fees</div>
          Default 10% — configurable per creator profile.
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="font-semibold text-ink mb-1">Payouts</div>
          Powered by Stripe Connect when enabled.
        </div>
      </div>
    </div>
  );
}
