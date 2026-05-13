import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/memberships")({ component: Memberships });

function Memberships() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => { (async () => {
    const { data } = await supabase.from("creator_tiers").select("*, creator_profiles(display_name, slug)").order("created_at", { ascending: false }).limit(500);
    setRows(data ?? []);
  })(); }, []);

  return (
    <div className="p-8">
      <PageHeader title="Memberships" subtitle={`${rows.length} tiers across all creators`} />
      {rows.length === 0 ? (
        <EmptyState title="No membership tiers yet." />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">Creator</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-2">{t.creator_profiles?.display_name ?? "—"}</td>
                  <td className="px-3 py-2 font-semibold">{t.name}</td>
                  <td className="px-3 py-2 font-mono">{t.currency} {Number(t.price).toFixed(2)}</td>
                  <td className="px-3 py-2">{t.is_active ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
