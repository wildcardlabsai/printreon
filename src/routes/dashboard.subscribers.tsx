import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { useServerFn } from "@tanstack/react-start";
import { listSubscribersForOwnCreator } from "@/functions/admin.functions";
import { Users, Mail, Search } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/dashboard/subscribers")({
  component: SubscribersPage,
});

function SubscribersPage() {
  const { creator } = useCreatorProfile();
  const [subs, setSubs] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [q, setQ] = useState("");
  const list = useServerFn(listSubscribersForOwnCreator);

  useEffect(() => {
    if (!creator) return;
    (async () => {
      const [data, { count }] = await Promise.all([
        list({ data: { creatorId: creator.id } }),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("creator_id", creator.id),
      ]);
      setSubs(data ?? []);
      setFollowers(count ?? 0);
    })();
  }, [creator]);

  const active = subs.filter((s) => s.status === "active");
  const mrr = active.reduce((sum, s) => sum + Number(s.creator_tiers?.price ?? 0), 0);
  const filtered = q
    ? subs.filter((s) => (s.profile?.email ?? "").toLowerCase().includes(q.toLowerCase()) || (s.profile?.full_name ?? "").toLowerCase().includes(q.toLowerCase()))
    : subs;

  const exportCsv = () => {
    const rows = [["email", "full_name", "tier", "price", "status", "joined"]];
    subs.forEach((s) => rows.push([s.profile?.email ?? "", s.profile?.full_name ?? "", s.creator_tiers?.name ?? "", String(s.creator_tiers?.price ?? ""), s.status, new Date(s.created_at).toISOString()]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const mailto = `mailto:?bcc=${active.map((s) => s.profile?.email).filter(Boolean).join(",")}`;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Active subscribers" value={active.length} />
        <Stat label="MRR" value={`$${mrr.toFixed(2)}`} />
        <Stat label="Followers" value={followers} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subscribers" className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <a href={mailto} className="btn-ghost h-10 px-3 text-sm"><Mail className="mr-2 h-4 w-4" />Email all</a>
        <button onClick={exportCsv} className="btn-ghost h-10 px-3 text-sm">Export CSV</button>
      </div>

      <h2 className="mt-6 text-lg font-bold text-ink">Subscribers ({subs.length})</h2>
      {subs.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No subscribers yet"
          description="Share your creator page on social to start growing your community. Once members subscribe, they'll show up here."
          actionLabel={creator?.slug ? "Open my page" : undefined}
          actionTo={creator?.slug ? `/c/${creator.slug}` : undefined}
        />
      ) : (
        <div className="card-soft mt-3 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">{s.profile?.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{s.profile?.email ?? "—"}</td>
                  <td className="px-4 py-3">{s.creator_tiers?.name ?? "—"} · ${Number(s.creator_tiers?.price ?? 0).toFixed(0)}/mo</td>
                  <td className="px-4 py-3 capitalize">{s.status}{s.cancel_at_period_end ? " · ending" : ""}</td>
                  <td className="px-4 py-3 text-ink-soft">{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-soft">
      <div className="text-xs font-semibold uppercase text-ink-soft">{label}</div>
      <div className="mt-2 text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
