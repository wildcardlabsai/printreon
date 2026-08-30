import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminRefundSubscription,
  adminCancelSubscription,
  adminCompAccess,
} from "@/functions/billing-admin.functions";

export const Route = createFileRoute("/admin/memberships")({ component: Memberships });

function Memberships() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [comp, setComp] = useState({ email: "", tierId: "", months: 1 });

  const refund = useServerFn(adminRefundSubscription);
  const cancel = useServerFn(adminCancelSubscription);
  const compFn = useServerFn(adminCompAccess);

  const load = useCallback(async () => {
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase
        .from("creator_tiers")
        .select("*, creator_profiles(display_name, slug)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("subscriptions")
        .select(
          "id, status, comped, cancel_at_period_end, current_period_end, creator_profiles(display_name), creator_tiers(name, price, currency)"
        )
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setTiers(t ?? []);
    setSubs(s ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-8 space-y-10">
      <div>
        <PageHeader title="Memberships" subtitle={`${tiers.length} tiers across all creators`} />
        {tiers.length === 0 ? (
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
                {tiers.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-3 py-2">{t.creator_profiles?.display_name ?? "—"}</td>
                    <td className="px-3 py-2 font-semibold">{t.name}</td>
                    <td className="px-3 py-2 font-mono">
                      {t.currency} {Number(t.price).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">{t.is_active ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink">Subscriber actions</h2>
        {subs.length === 0 ? (
          <EmptyState title="No memberships yet." />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase text-ink-soft">
                <tr>
                  <th className="px-3 py-2">Creator</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Renews</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-2">{s.creator_profiles?.display_name ?? "—"}</td>
                    <td className="px-3 py-2">{s.creator_tiers?.name ?? "—"}</td>
                    <td className="px-3 py-2">
                      {s.status}
                      {s.comped && <span className="ml-1 text-xs text-ink-soft">(comped)</span>}
                      {s.cancel_at_period_end && (
                        <span className="ml-1 text-xs text-amber-600">(ending)</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === s.id}
                        onClick={() =>
                          run(s.id, () => refund({ data: { subscriptionId: s.id } }), "Refund issued")
                        }
                      >
                        Refund
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === s.id}
                        onClick={() =>
                          run(
                            s.id,
                            () => cancel({ data: { subscriptionId: s.id, immediate: false } }),
                            "Will cancel at period end"
                          )
                        }
                      >
                        Cancel at period end
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy === s.id}
                        onClick={() =>
                          run(
                            s.id,
                            () => cancel({ data: { subscriptionId: s.id, immediate: true } }),
                            "Membership canceled"
                          )
                        }
                      >
                        Cancel now
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="max-w-xl">
        <h2 className="mb-3 text-lg font-semibold text-ink">Grant comped access</h2>
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <Input
            placeholder="Member email"
            value={comp.email}
            onChange={(e) => setComp({ ...comp, email: e.target.value })}
          />
          <select
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            value={comp.tierId}
            onChange={(e) => setComp({ ...comp, tierId: e.target.value })}
          >
            <option value="">Select a tier…</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.creator_profiles?.display_name ?? "—"} — {t.name}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min={1}
            max={24}
            value={comp.months}
            onChange={(e) => setComp({ ...comp, months: Number(e.target.value) })}
          />
          <Button
            disabled={!comp.email || !comp.tierId || busy === "comp"}
            onClick={() =>
              run(
                "comp",
                () =>
                  compFn({
                    data: { email: comp.email, tierId: comp.tierId, months: comp.months },
                  }),
                "Comped access granted"
              )
            }
          >
            Grant access
          </Button>
        </div>
      </div>
    </div>
  );
}
