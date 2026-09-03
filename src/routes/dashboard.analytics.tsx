import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { TrendingUp, Download, Users, DollarSign, UserMinus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { creatorEarningsSummary, type EarningsSummary } from "@/functions/earnings.functions";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
  { key: "365", label: "12 months", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

function AnalyticsPage() {
  const { creator } = useCreatorProfile();
  const [range, setRange] = useState<RangeKey>("30");
  const days = RANGES.find((r) => r.key === range)!.days;

  const [downloads, setDownloads] = useState<any[]>([]);
  const [allSubs, setAllSubs] = useState<any[]>([]);
  const [topFiles, setTopFiles] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const loadEarnings = useServerFn(creatorEarningsSummary);

  useEffect(() => {
    loadEarnings({ data: undefined })
      .then(setEarnings)
      .catch(() => setEarnings(null));
  }, [loadEarnings]);

  useEffect(() => {
    if (!creator) return;
    const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
    (async () => {
      const [{ data: d }, { data: s }, { data: f }] = await Promise.all([
        supabase.from("downloads").select("downloaded_at").eq("creator_id", creator.id).gte("downloaded_at", since),
        supabase
          .from("subscriptions")
          .select("id, status, created_at, updated_at, cancel_at_period_end, tier_id, creator_tiers(name, price, billing_interval)")
          .eq("creator_id", creator.id),
        supabase.from("creator_files").select("id, title, download_count").eq("creator_id", creator.id).order("download_count", { ascending: false }).limit(10),
      ]);
      setDownloads(d ?? []);
      setAllSubs(s ?? []);
      setTopFiles(f ?? []);
    })();
  }, [creator, days]);

  const sinceMs = Date.now() - days * 86400 * 1000;
  const newSubs = allSubs.filter((s) => new Date(s.created_at).getTime() >= sinceMs);
  const activeSubs = allSubs.filter((s) => s.status === "active" || s.status === "trialing");
  const churnedInRange = allSubs.filter(
    (s) => s.status === "canceled" && s.updated_at && new Date(s.updated_at).getTime() >= sinceMs,
  );

  const series = useMemo(() => {
    const revByDay = new Map((earnings?.daily ?? []).map((d) => [d.date, d.net]));
    const out: { label: string; date: string; downloads: number; subs: number; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 86400 * 1000);
      const key = dt.toISOString().slice(0, 10);
      out.push({
        date: key,
        label: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        downloads: 0,
        subs: 0,
        revenue: revByDay.get(key) ?? 0,
      });
    }
    const idx = new Map(out.map((d, i) => [d.date, i]));
    downloads.forEach((d) => { const i = idx.get((d.downloaded_at as string).slice(0, 10)); if (i != null) out[i].downloads++; });
    newSubs.forEach((s) => { const i = idx.get((s.created_at as string).slice(0, 10)); if (i != null) out[i].subs++; });
    return out;
  }, [downloads, allSubs, earnings, days]);

  const totalDl = downloads.length;
  const newMrr = newSubs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.creator_tiers?.price ?? 0), 0);
  const rangeRevenue = series.reduce((a, d) => a + d.revenue, 0);

  const churnRate = activeSubs.length + churnedInRange.length > 0
    ? (churnedInRange.length / (activeSubs.length + churnedInRange.length)) * 100
    : 0;
  const retention = 100 - churnRate;

  const tierMix = useMemo(() => {
    const m = new Map<string, { name: string; count: number; mrr: number }>();
    activeSubs.forEach((s) => {
      const name = s.creator_tiers?.name ?? "Tier";
      const price = Number(s.creator_tiers?.price ?? 0);
      const monthly = s.creator_tiers?.billing_interval === "year" ? price / 12 : price;
      const row = m.get(name) ?? { name, count: 0, mrr: 0 };
      row.count++;
      row.mrr += monthly;
      m.set(name, row);
    });
    return Array.from(m.values()).sort((a, b) => b.mrr - a.mrr);
  }, [allSubs]);

  const annualCount = activeSubs.filter((s) => s.creator_tiers?.billing_interval === "year").length;
  const maxDl = Math.max(1, ...series.map((d) => d.downloads));
  const maxRev = Math.max(1, ...series.map((d) => d.revenue));

  const exportCsv = () => {
    const head = ["Date", "Downloads", "New subscriptions", "Net revenue"];
    const body = series.map((d) => [d.date, d.downloads, d.subs, d.revenue.toFixed(2)]);
    const csv = [head, ...body].map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `printreon-analytics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${range === r.key ? "border-ink bg-ink text-background" : "border-border text-ink-soft hover:text-ink"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button onClick={exportCsv} className="btn-secondary h-9">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label={`Downloads (${days}d)`} value={totalDl} icon={Download} />
        <Stat label={`New subs (${days}d)`} value={newSubs.length} icon={Users} />
        <Stat label={`New MRR (${days}d)`} value={`£${newMrr.toFixed(0)}`} icon={DollarSign} />
        <Stat label={`Revenue (${days}d)`} value={`£${rangeRevenue.toFixed(2)}`} icon={DollarSign} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Stat label="Active supporters" value={activeSubs.length} icon={Users} />
        <Stat label={`Cancellations (${days}d)`} value={churnedInRange.length} icon={UserMinus} />
        <Stat label="Retention" value={`${retention.toFixed(1)}%`} icon={TrendingUp} />
      </div>

      <div className="card-soft mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Activity (last {days} days)</h2>
          <div className="ml-auto mr-3 flex items-center gap-3 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary/80" /> Downloads</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500/70" /> Revenue</span>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-4 flex h-40 items-end gap-1">
          {series.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end gap-[2px]">
              <div className="w-1/2 rounded-t bg-primary/80 transition-all" style={{ height: `${(d.downloads / maxDl) * 100}%` }} />
              <div className="w-1/2 rounded-t bg-emerald-500/70 transition-all" style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
              <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] font-medium text-card group-hover:block">
                {d.label}: {d.downloads} dl · {d.subs} subs · £{d.revenue.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink-soft">
          <span>{series[0]?.label}</span>
          <span>{series[series.length - 1]?.label}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Tier mix</h2>
          <p className="mt-1 text-xs text-ink-soft">
            {activeSubs.length} active · {annualCount} on annual billing
          </p>
          {tierMix.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">No active supporters yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {tierMix.map((t) => (
                <li key={t.name} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">{t.name}</span>
                  <span className="text-ink-soft">
                    {t.count} · <span className="font-semibold text-primary">£{t.mrr.toFixed(2)}/mo</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Top files</h2>
          {topFiles.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">No download data yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {topFiles.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">{f.title}</span>
                  <span className="font-semibold text-primary">{f.download_count} downloads</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="card-soft">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs font-semibold uppercase text-ink-soft">{label}</div>
      <div className="mt-1 text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
