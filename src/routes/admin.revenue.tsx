import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/AdminUI";
import { adminRevenueMetrics } from "@/functions/ops.functions";

export const Route = createFileRoute("/admin/revenue")({ component: Revenue });

const money = (n: number) => `£${n.toFixed(2)}`;

function Revenue() {
  const load = useServerFn(adminRevenueMetrics);
  const [m, setM] = useState<any>(null);

  useEffect(() => {
    load({})
      .then(setM)
      .catch((e: any) => toast.error(e?.message ?? "Could not load metrics"));
  }, [load]);

  if (!m) return <div className="p-8 text-ink-soft">Loading…</div>;

  const max = Math.max(1, ...m.series.map((s: any) => s.gross));

  return (
    <div className="p-8">
      <PageHeader title="Revenue analytics" subtitle="MRR, churn and lifetime value across the platform" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="MRR" value={money(m.mrr)} hint={`${m.activeCount} paid memberships`} />
        <StatCard label="ARR" value={money(m.arr)} />
        <StatCard label="ARPU" value={money(m.arpu)} />
        <StatCard label="Est. LTV" value={money(m.ltv)} hint="ARPU ÷ monthly churn" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Monthly churn" value={`${(m.churnRate * 100).toFixed(1)}%`} hint={`${m.churnedLast30} lost in 30 days`} />
        <StatCard label="In trial" value={m.trialingCount} />
        <StatCard label="Comped" value={m.compedCount} />
        <StatCard label="Active total" value={m.activeCount + m.compedCount} />
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold text-ink">Collected by month</h2>
      {m.series.length === 0 ? (
        <EmptyState title="No payments recorded yet" description="Monthly gross and platform fees appear once Stripe events flow in." />
      ) : (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex h-48 items-end gap-3">
            {m.series.map((s: any) => (
              <div key={s.month} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${(s.gross / max) * 100}%` }}
                  title={`${money(s.gross)} gross · ${money(s.fees)} fees`}
                />
                <span className="text-[10px] text-ink-soft">{s.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
