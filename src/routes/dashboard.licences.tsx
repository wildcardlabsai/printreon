import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { EmptyState } from "@/components/EmptyState";
import { ScrollText, Save, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { listIssuedLicences, type IssuedLicence } from "@/functions/licences.functions";

export const Route = createFileRoute("/dashboard/licences")({
  head: () => ({
    meta: [
      { title: "Commercial licences — Printreon" },
      {
        name: "description",
        content: "Choose which membership tiers include a commercial licence and see who currently holds one.",
      },
    ],
  }),
  component: LicencesPage,
});

function LicencesPage() {
  const { creator } = useCreatorProfile();
  const [tiers, setTiers] = useState<any[] | null>(null);
  const [issued, setIssued] = useState<IssuedLicence[] | null>(null);
  const fetchIssued = useServerFn(listIssuedLicences);

  const refresh = async () => {
    if (!creator) return;
    const { data } = await supabase
      .from("creator_tiers")
      .select("*")
      .eq("creator_id", creator.id)
      .order("price");
    setTiers(data ?? []);
  };

  useEffect(() => {
    refresh();
  }, [creator]);

  useEffect(() => {
    if (!creator) return;
    fetchIssued()
      .then((rows) => setIssued(rows))
      .catch(() => setIssued([]));
  }, [creator]);

  const save = async (tier: any, patch: any) => {
    const { error } = await supabase.from("creator_tiers").update(patch).eq("id", tier.id);
    if (error) return toast.error(error.message);
    toast.success("Licence settings saved");
    refresh();
    fetchIssued().then(setIssued).catch(() => {});
  };

  const exportCsv = () => {
    const rows = issued ?? [];
    const head = ["Licence no.", "Member", "Email", "Tier", "Status", "Active since", "Renews/ends"];
    const body = rows.map((r) => [
      r.licenceNumber ?? "",
      r.memberName,
      r.memberEmail,
      r.tierName,
      r.cancelAtPeriodEnd ? `${r.status} (cancelling)` : r.status,
      r.activeSince ? new Date(r.activeSince).toISOString().slice(0, 10) : "",
      r.endsAt ? new Date(r.endsAt).toISOString().slice(0, 10) : "",
    ]);

    const csv = [head, ...body]
      .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "printreon-commercial-licences.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-ink">Commercial licences</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          By default every download is licensed for personal, non-commercial printing. Flag a tier below to grant
          its subscribers a commercial licence — valid for as long as their subscription stays active.
        </p>
      </div>

      {tiers === null ? (
        <div className="text-ink-soft">Loading tiers…</div>
      ) : tiers.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No tiers yet"
          description="Create a membership tier first, then decide whether it includes commercial rights."
        />
      ) : (
        <div className="grid gap-4">
          {tiers.map((t) => (
            <LicenceEditor key={t.id} tier={t} onSave={save} />
          ))}
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Issued licences ({issued?.length ?? 0})</h2>
          {issued && issued.length > 0 && (
            <button onClick={exportCsv} className="btn-secondary h-9">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </button>
          )}
        </div>
        {issued === null ? (
          <div className="mt-3 text-ink-soft">Loading…</div>
        ) : issued.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No commercial licences issued"
            description="Once a supporter subscribes to a tier that includes commercial rights, they'll be listed here."
          />
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Licence no.</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active since</th>
                  <th className="px-4 py-3">Renews / ends</th>
                </tr>
              </thead>
              <tbody>
                {issued.map((r) => (
                  <tr key={r.subscriptionId} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{r.licenceNumber ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{r.memberName}</div>
                      <div className="text-xs text-ink-soft">{r.memberEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{r.tierName}</td>

                    <td className="px-4 py-3 text-ink-soft">
                      {r.cancelAtPeriodEnd ? `${r.status} · cancelling` : r.status}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {r.activeSince ? new Date(r.activeSince).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {r.endsAt ? new Date(r.endsAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LicenceEditor({ tier, onSave }: { tier: any; onSave: (t: any, p: any) => void }) {
  const [on, setOn] = useState(!!tier.commercial_licence);
  const [summary, setSummary] = useState(tier.commercial_licence_summary ?? "");
  const [terms, setTerms] = useState(tier.commercial_licence_terms ?? "");
  const [units, setUnits] = useState(
    tier.commercial_units_limit === null || tier.commercial_units_limit === undefined
      ? ""
      : String(tier.commercial_units_limit)
  );
  const [attribution, setAttribution] = useState(!!tier.commercial_attribution_required);

  return (
    <div className="card-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-ink">
          {tier.name}{" "}
          <span className="text-sm font-medium text-ink-soft">
            ${Number(tier.price).toFixed(0)}/{tier.billing_interval === "year" ? "yr" : "mo"}
          </span>
        </h3>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} />
          Includes commercial licence
        </label>
      </div>

      {on && (
        <div className="mt-4 space-y-3">
          <Field label="Licence summary (shown to supporters)">
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className={inp}
              placeholder="Sell prints of any file in this tier, physical products only."
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Max units sold per year (blank = unlimited)">
              <input
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className={inp}
              />
            </Field>
            <label className="mt-6 flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={attribution}
                onChange={(e) => setAttribution(e.target.checked)}
              />
              Attribution required
            </label>
          </div>
          <Field label="Full licence terms (optional)">
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={5} className={inp} />
          </Field>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() =>
            onSave(tier, {
              commercial_licence: on,
              commercial_licence_summary: summary.trim() || null,
              commercial_licence_terms: terms.trim() || null,
              commercial_units_limit: units.trim() === "" ? null : Number(units),
              commercial_attribution_required: attribution,
            })
          }
          className="btn-primary h-9"
        >
          <Save className="mr-2 h-4 w-4" /> Save
        </button>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
