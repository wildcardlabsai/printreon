import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { TrendingUp, Download, Users, DollarSign } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
});

const DAYS = 30;

function AnalyticsPage() {
  const { creator } = useCreatorProfile();
  const [downloads, setDownloads] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [topFiles, setTopFiles] = useState<any[]>([]);

  useEffect(() => {
    if (!creator) return;
    const since = new Date(Date.now() - DAYS * 86400 * 1000).toISOString();
    (async () => {
      const [{ data: d }, { data: s }, { data: f }] = await Promise.all([
        supabase.from("downloads").select("downloaded_at").eq("creator_id", creator.id).gte("downloaded_at", since),
        supabase.from("subscriptions").select("created_at, status, creator_tiers(price)").eq("creator_id", creator.id).gte("created_at", since),
        supabase.from("creator_files").select("id, title, download_count").eq("creator_id", creator.id).order("download_count", { ascending: false }).limit(10),
      ]);
      setDownloads(d ?? []); setSubs(s ?? []); setTopFiles(f ?? []);
    })();
  }, [creator]);

  const series = useMemo(() => {
    const days: { label: string; date: string; downloads: number; subs: number }[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 86400 * 1000);
      const key = dt.toISOString().slice(0, 10);
      days.push({ date: key, label: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }), downloads: 0, subs: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    downloads.forEach((d) => { const k = (d.downloaded_at as string).slice(0, 10); const i = idx.get(k); if (i != null) days[i].downloads++; });
    subs.forEach((s) => { const k = (s.created_at as string).slice(0, 10); const i = idx.get(k); if (i != null) days[i].subs++; });
    return days;
  }, [downloads, subs]);

  const totalDl = downloads.length;
  const totalNewSubs = subs.length;
  const newMrr = subs.filter((s) => s.status === "active").reduce((sum, s) => sum + Number(s.creator_tiers?.price ?? 0), 0);

  const maxDl = Math.max(1, ...series.map((d) => d.downloads));

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label={`Downloads (${DAYS}d)`} value={totalDl} icon={Download} />
        <Stat label={`New subs (${DAYS}d)`} value={totalNewSubs} icon={Users} />
        <Stat label={`New MRR (${DAYS}d)`} value={`$${newMrr.toFixed(0)}`} icon={DollarSign} />
      </div>

      <div className="card-soft mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Activity (last {DAYS} days)</h2>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div className="mt-4 flex h-40 items-end gap-1">
          {series.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div className="w-full rounded-t bg-primary/80 transition-all" style={{ height: `${(d.downloads / maxDl) * 100}%` }} />
              <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] font-medium text-card group-hover:block">
                {d.label}: {d.downloads} dl · {d.subs} subs
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-ink-soft">
          <span>{series[0]?.label}</span>
          <span>{series[series.length - 1]?.label}</span>
        </div>
      </div>

      <div className="card-soft mt-6">
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
