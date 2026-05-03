import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/subscribers")({
  component: SubscribersPage,
});

function SubscribersPage() {
  const { creator } = useCreatorProfile();
  const [subs, setSubs] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    if (!creator) return;
    (async () => {
      const [{ data: s }, { count }] = await Promise.all([
        supabase.from("subscriptions").select("*, creator_tiers(name, price), profiles!inner(email, full_name)").eq("creator_id", creator.id),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("creator_id", creator.id),
      ]);
      setSubs(s ?? []);
      setFollowers(count ?? 0);
    })();
  }, [creator]);

  const active = subs.filter((s) => s.status === "active");
  const mrr = active.reduce((sum, s) => sum + Number(s.creator_tiers?.price ?? 0), 0);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Active subscribers" value={active.length} />
        <Stat label="MRR" value={`$${mrr.toFixed(2)}`} />
        <Stat label="Followers" value={followers} />
      </div>

      <h2 className="mt-6 text-lg font-bold text-ink">Subscribers</h2>
      {subs.length === 0 ? (
        <div className="card-soft mt-3 text-center">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-2 text-ink-soft">No subscribers yet. Share your page to get going.</p>
        </div>
      ) : (
        <div className="card-soft mt-3 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Since</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3">{s.profiles?.full_name ?? s.profiles?.email ?? "—"}</td>
                  <td className="px-4 py-3">{s.creator_tiers?.name ?? "—"} · ${Number(s.creator_tiers?.price ?? 0).toFixed(0)}/mo</td>
                  <td className="px-4 py-3 capitalize">{s.status}</td>
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
