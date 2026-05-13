import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/analytics")({ component: Analytics });

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-24 text-xs text-ink-soft">{label}</div>
      <div className="flex-1 h-3 bg-secondary rounded">
        <div className="h-3 bg-primary rounded" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 text-right text-xs">{value}</div>
    </div>
  );
}

function groupByDay(rows: any[], days = 14) {
  const out: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
    out[d.toISOString().slice(0,10)] = 0;
  }
  rows.forEach((r) => {
    const k = new Date(r.created_at).toISOString().slice(0,10);
    if (k in out) out[k]++;
  });
  return out;
}

function Analytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setDate(since.getDate() - 14);
      const [pre, users, files, tiers, tickets, topFiles] = await Promise.all([
        supabase.from("beta_preregistrations").select("created_at").gte("created_at", since.toISOString()),
        supabase.from("profiles").select("created_at").gte("created_at", since.toISOString()),
        supabase.from("creator_files").select("created_at").gte("created_at", since.toISOString()),
        supabase.from("creator_tiers").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("created_at").gte("created_at", since.toISOString()),
        supabase.from("creator_files").select("title, download_count").order("download_count", { ascending: false }).limit(10),
      ]);
      setData({
        preByDay: groupByDay(pre.data ?? []),
        usersByDay: groupByDay(users.data ?? []),
        filesByDay: groupByDay(files.data ?? []),
        ticketsByDay: groupByDay(tickets.data ?? []),
        tiersCount: tiers.count ?? 0,
        topFiles: topFiles.data ?? [],
      });
    })();
  }, []);

  if (!data) return <div className="p-8 text-ink-soft">Loading analytics…</div>;
  const series = (obj: Record<string, number>) => Object.entries(obj).map(([label, value]) => ({ label: label.slice(5), value }));
  const renderSeries = (s: { label: string; value: number }[]) => {
    const max = Math.max(1, ...s.map((x) => x.value));
    return s.map((x) => <Bar key={x.label} label={x.label} value={x.value} max={max} />);
  };

  return (
    <div className="p-8">
      <PageHeader title="Analytics" subtitle="Activity across the past 14 days." />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Preregistrations</h3>
          <div className="space-y-1">{renderSeries(series(data.preByDay))}</div>
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">User signups</h3>
          <div className="space-y-1">{renderSeries(series(data.usersByDay))}</div>
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">STL uploads</h3>
          <div className="space-y-1">{renderSeries(series(data.filesByDay))}</div>
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Support volume</h3>
          <div className="space-y-1">{renderSeries(series(data.ticketsByDay))}</div>
        </section>
      </div>

      <h2 className="mt-10 mb-3 text-lg font-bold">Top files by downloads</h2>
      {data.topFiles.length === 0 ? (
        <EmptyState title="No downloads yet." />
      ) : (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {data.topFiles.map((f: any, i: number) => (
            <div key={i} className="flex justify-between px-4 py-2 text-sm">
              <span>{f.title}</span>
              <span className="font-mono text-ink-soft">{f.download_count}</span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-ink-soft">Membership tiers configured: {data.tiersCount}</p>
    </div>
  );
}
