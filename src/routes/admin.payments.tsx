import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/payments")({ component: Payments });

type LedgerRow = {
  id: string;
  kind: string;
  status: string;
  currency: string;
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  failure_reason: string | null;
  occurred_at: string;
  creator_profiles: { display_name: string } | null;
};

const money = (n: number, c = "gbp") =>
  `${c.toUpperCase() === "GBP" ? "£" : c.toUpperCase() === "USD" ? "$" : ""}${n.toFixed(2)}`;

function Payments() {
  const [rows, setRows] = useState<LedgerRow[] | null>(null);
  const [stripeOn, setStripeOn] = useState(false);
  const [activeSubs, setActiveSubs] = useState(0);
  const [pastDue, setPastDue] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: events }, { data: flag }, { data: subs }] = await Promise.all([
        supabase
          .from("payment_events")
          .select(
            "id, kind, status, currency, gross_amount, platform_fee, net_amount, failure_reason, occurred_at, creator_profiles(display_name)"
          )
          .order("occurred_at", { ascending: false })
          .limit(100),
        supabase
          .from("feature_flags")
          .select("enabled")
          .eq("key", "stripe_payments_enabled")
          .maybeSingle(),
        supabase.from("subscriptions").select("status"),
      ]);
      setRows((events ?? []) as unknown as LedgerRow[]);
      setStripeOn(!!flag?.enabled);
      setActiveSubs((subs ?? []).filter((s: any) => s.status === "active").length);
      setPastDue((subs ?? []).filter((s: any) => s.status === "past_due" || s.status === "unpaid").length);
    })();
  }, []);

  if (!rows) return <div className="p-8 text-ink-soft">Loading…</div>;

  const succeeded = rows.filter((r) => r.status === "succeeded");
  const gross = succeeded.reduce((a, r) => a + Number(r.gross_amount), 0);
  const platformFees = succeeded.reduce((a, r) => a + Number(r.platform_fee), 0);
  const reversals = rows
    .filter((r) => r.status === "reversed")
    .reduce((a, r) => a + Math.abs(Number(r.gross_amount)), 0);
  const failedCount = rows.filter((r) => r.status === "failed").length;

  return (
    <div className="p-8">
      <PageHeader title="Payments" subtitle="Live earnings ledger from Stripe events" />
      {!stripeOn && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700">
          Stripe is not connected yet. Ledger rows appear as soon as live payments start flowing.
        </div>
      )}

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatCard label="Gross collected" value={money(gross)} />
        <StatCard label="Platform fees" value={money(platformFees)} />
        <StatCard label="Refunds & disputes" value={money(reversals)} />
        <StatCard label="Active subscriptions" value={activeSubs} />
        <StatCard label="Past due" value={pastDue} />
      </div>

      <h2 className="mt-10 mb-3 text-lg font-semibold text-ink">
        Recent transactions {failedCount > 0 && <span className="text-sm text-ink-soft">({failedCount} failed)</span>}
      </h2>

      {rows.length === 0 ? (
        <EmptyState
          title="No payment events yet."
          description="Every successful charge, refund, dispute and failed payment will be recorded here."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-soft">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Creator</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium text-right">Gross</th>
                <th className="p-3 font-medium text-right">Fee</th>
                <th className="p-3 font-medium text-right">Net</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3 whitespace-nowrap">
                    {new Date(r.occurred_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">{r.creator_profiles?.display_name ?? "—"}</td>
                  <td className="p-3 capitalize">{r.kind}</td>
                  <td className="p-3 text-right">{money(Number(r.gross_amount), r.currency)}</td>
                  <td className="p-3 text-right">{money(Number(r.platform_fee), r.currency)}</td>
                  <td className="p-3 text-right">{money(Number(r.net_amount), r.currency)}</td>
                  <td className="p-3">
                    <span
                      className={
                        r.status === "succeeded"
                          ? "text-emerald-600"
                          : r.status === "failed"
                            ? "text-red-600"
                            : "text-amber-600"
                      }
                      title={r.failure_reason ?? undefined}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
