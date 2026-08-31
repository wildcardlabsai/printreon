import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Banknote, TrendingUp, Wallet, AlertTriangle } from "lucide-react";
import {
  creatorEarningsSummary,
  creatorEarningsTransactions,
  type EarningsSummary,
  type EarningsTransaction,
} from "@/functions/earnings.functions";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/dashboard/earnings")({
  head: () => ({ meta: [{ title: "Earnings — Printreon creator studio" }] }),
  component: EarningsPage,
});

const money = (n: number, currency = "usd") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(n || 0);

const monthLabel = (key: string) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "short", year: "2-digit" });

function EarningsPage() {
  const loadSummary = useServerFn(creatorEarningsSummary);
  const loadTx = useServerFn(creatorEarningsTransactions);

  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [tx, setTx] = useState<EarningsTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<"all" | "paid" | "refunded" | "failed">("all");

  useEffect(() => {
    loadSummary({ data: undefined })
      .then(setSummary)
      .catch((e: any) => toast.error(e?.message ?? "Could not load earnings"));
  }, [loadSummary]);

  const refreshTx = useCallback(async () => {
    setLoadingTx(true);
    try {
      const r = await loadTx({ data: { from: from || undefined, to: to || undefined, status, limit: 200, offset: 0 } });
      setTx(r.items);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load transactions");
    } finally {
      setLoadingTx(false);
    }
  }, [from, to, status, loadTx]);

  useEffect(() => {
    refreshTx();
  }, [refreshTx]);

  const currency = summary?.currency ?? "usd";
  const maxMonth = useMemo(() => Math.max(1, ...(summary?.months ?? []).map((m) => m.net)), [summary]);

  const exportCsv = () => {
    const rows = [["date", "type", "status", "member", "tier", "gross", "platform_fee", "processing_fee", "net"]];
    tx.forEach((t) =>
      rows.push([
        new Date(t.occurredAt).toISOString(),
        t.kind,
        t.status,
        t.member,
        t.tier,
        String(t.gross),
        String(t.platformFee),
        String(t.stripeFee),
        String(t.net),
      ]),
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "printreon-earnings.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Banknote} label="Earned this month" value={money(summary?.thisMonth ?? 0, currency)} />
        <Stat icon={TrendingUp} label="Last month" value={money(summary?.lastMonth ?? 0, currency)} />
        <Stat icon={Wallet} label="Lifetime net" value={money(summary?.lifetime ?? 0, currency)} />
        <Stat
          icon={Wallet}
          label="Pending this period"
          value={money(summary?.pending ?? 0, currency)}
          sub="Not yet paid out"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="card-soft lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">Earnings by month</h2>
          {!summary || summary.months.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">No earnings recorded yet.</p>
          ) : (
            <>
              <div className="mt-5 flex h-40 items-end gap-2">
                {summary.months.map((m) => (
                  <div key={m.month} className="group relative flex flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${Math.max(2, (m.net / maxMonth) * 100)}%` }}
                    />
                    <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] font-medium text-card group-hover:block">
                      {monthLabel(m.month)}: {money(m.net, currency)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-ink-soft">
                <span>{monthLabel(summary.months[0]!.month)}</span>
                <span>{monthLabel(summary.months[summary.months.length - 1]!.month)}</span>
              </div>
            </>
          )}
        </div>

        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Where the money goes</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Gross sales" value={money(summary?.gross ?? 0, currency)} />
            <Row label="Platform fee" value={`− ${money(summary?.platformFee ?? 0, currency)}`} />
            <Row label="Processing fee" value={`− ${money(summary?.stripeFee ?? 0, currency)}`} />
            <div className="border-t border-border pt-3">
              <Row label="Your net" value={money(summary?.lifetime ?? 0, currency)} strong />
            </div>
          </dl>
          {(summary?.failedCount ?? 0) > 0 && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {summary!.failedCount} failed payment{summary!.failedCount === 1 ? "" : "s"} — these members are at risk
              of churning.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-2">
        <label className="text-xs text-ink-soft">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="text-xs text-ink-soft">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="text-xs text-ink-soft">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm text-ink"
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <button onClick={exportCsv} disabled={tx.length === 0} className="btn-ghost h-10 px-3 text-sm disabled:opacity-40">
          Export CSV
        </button>
      </div>

      <h2 className="mt-6 text-lg font-bold text-ink">Transactions</h2>
      {loadingTx ? (
        <p className="mt-2 text-sm text-ink-soft">Loading…</p>
      ) : tx.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No transactions yet"
          description="Once members subscribe to your tiers, every payment, fee and payout shows up here."
        />
      ) : (
        <div className="card-soft mt-3 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Fees</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tx.map((t) => {
                const failed = t.status === "failed" || t.kind.includes("failed");
                return (
                  <tr key={t.id} className={failed ? "bg-amber-50/60" : undefined}>
                    <td className="px-4 py-3 text-ink-soft">{new Date(t.occurredAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-ink">{t.member}</td>
                    <td className="px-4 py-3 text-ink-soft">{t.tier}</td>
                    <td className="px-4 py-3 text-right text-ink">{money(t.gross, t.currency)}</td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {money(t.platformFee + t.stripeFee, t.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">{money(t.net, t.currency)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          failed ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {failed ? t.failureReason || "failed" : t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="card-soft">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</div>
      <div className="mt-1 text-3xl font-bold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-soft">{sub}</div>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={strong ? "text-base font-bold text-ink" : "font-medium text-ink"}>{value}</dd>
    </div>
  );
}
