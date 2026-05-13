import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatCard, EmptyState } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/")({
  component: Overview,
});

function Overview() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const [
        prereg, pregToday, invitesSent, invitesUsed, users, creators, files, subs, tickets, log,
      ] = await Promise.all([
        supabase.from("beta_preregistrations").select("*", { count: "exact", head: true }),
        supabase.from("beta_preregistrations").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("invite_codes").select("*", { count: "exact", head: true }),
        supabase.from("invite_codes").select("*", { count: "exact", head: true }).eq("status", "used"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("creator_profiles").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("creator_files").select("*", { count: "exact", head: true }),
        supabase.from("subscriptions").select("creator_tiers(price)").eq("status", "active"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(15),
      ]);
      const mrr = (subs.data ?? []).reduce((acc: number, s: any) => acc + Number(s?.creator_tiers?.price ?? 0), 0);
      const acceptanceRate = (invitesSent.count ?? 0) > 0 ? Math.round(((invitesUsed.count ?? 0) / (invitesSent.count ?? 1)) * 100) : 0;
      setStats({
        prereg: prereg.count ?? 0,
        pregToday: pregToday.count ?? 0,
        invitesSent: invitesSent.count ?? 0,
        acceptanceRate,
        users: users.count ?? 0,
        creators: creators.count ?? 0,
        files: files.count ?? 0,
        subs: (subs.data ?? []).length,
        mrr,
        tickets: tickets.count ?? 0,
      });
      setActivity(log.data ?? []);
    })();
  }, []);

  return (
    <div className="p-8">
      <PageHeader title="Overview" subtitle="Live snapshot of the Printreon platform." />
      {!stats ? (
        <div className="text-ink-soft">Loading metrics…</div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            <StatCard label="Preregistrations" value={stats.prereg} hint={`${stats.pregToday} today`} />
            <StatCard label="Invites sent" value={stats.invitesSent} hint={`${stats.acceptanceRate}% accepted`} />
            <StatCard label="Total users" value={stats.users} />
            <StatCard label="Active creators" value={stats.creators} />
            <StatCard label="STL files" value={stats.files} />
            <StatCard label="Memberships" value={stats.subs} />
            <StatCard label="Estimated MRR" value={`£${stats.mrr.toFixed(2)}`} />
            <StatCard label="Open tickets" value={stats.tickets} />
          </div>

          <h2 className="mt-10 mb-3 text-lg font-bold text-ink">Recent admin activity</h2>
          {activity.length === 0 ? (
            <EmptyState title="No admin activity yet." description="Actions you take here will appear in this feed." />
          ) : (
            <div className="rounded-lg border border-border bg-card divide-y divide-border">
              {activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{a.action}</span>
                    {a.target_type && <span className="ml-2 text-ink-soft">on {a.target_type}</span>}
                  </div>
                  <span className="text-xs text-ink-soft">{new Date(a.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
