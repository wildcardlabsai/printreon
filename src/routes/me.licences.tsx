import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { myLicences, type MemberLicence } from "@/functions/licences.functions";
import { MemberNav } from "@/components/MemberNav";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { ScrollText, Printer, BadgeCheck, Lock } from "lucide-react";

export const Route = createFileRoute("/me/licences")({
  head: () => ({
    meta: [
      { title: "Commercial licences — Printreon" },
      {
        name: "description",
        content: "See which of your Printreon memberships include a commercial licence and print your certificate.",
      },
      { property: "og:title", content: "Commercial licences — Printreon" },
      {
        property: "og:description",
        content: "Your commercial printing rights, tier by tier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Licences,
});

function money(price?: number | null, currency?: string | null, interval?: string | null) {
  if (price == null) return null;
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return `${symbol}${Number(price).toFixed(2)}/${interval === "year" ? "yr" : "mo"}`;
}

function Licences() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [licences, setLicences] = useState<MemberLicence[] | null>(null);
  const [certificate, setCertificate] = useState<MemberLicence | null>(null);
  const loadLicences = useServerFn(myLicences);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select(
        "id, status, created_at, current_period_end, cancel_at_period_end, creator_profiles(display_name, slug), creator_tiers(name, price, billing_interval, commercial_licence)"
      )
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
    loadLicences()
      .then((l) => setLicences(l))
      .catch(() => setLicences([]));
  }, [user]);

  const licensee = user?.email ?? "You";
  const personal = (rows ?? []).filter((r) => !r.creator_tiers?.commercial_licence);

  const printCertificate = (l: MemberLicence) => {
    setCertificate(l);
    setTimeout(() => {
      window.print();
    }, 60);
  };

  return (
    <div>
      <div className={certificate ? "hidden print:hidden" : "print:hidden"}>
        <MemberNav />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Commercial licences</h1>
          <p className="text-sm text-ink-soft">
            Every commercial tier issues a numbered certificate. Rights stay valid while that membership is active.
          </p>
        </div>

        {licences === null ? (
          <div className="text-ink-soft">Loading…</div>
        ) : licences.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No commercial licences yet"
            description="Subscribe to a creator's commercial tier and your numbered certificate will appear here."
          />
        ) : (
          <div className="grid gap-4">
            {licences.map((l) => {
              const active = l.status === "active";
              return (
                <div
                  key={l.id}
                  className={`rounded-xl border p-5 ${active ? "border-primary/40 bg-primary/5" : "border-border bg-card opacity-80"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-ink">
                        {l.creatorName} · {l.tierName}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-ink-soft">Licence {l.licenceNumber}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Licensee {licensee} · issued {new Date(l.issuedAt).toLocaleDateString()}
                        {l.revokedAt
                          ? ` · ended ${new Date(l.revokedAt).toLocaleDateString()}`
                          : l.cancelAtPeriodEnd && l.endsAt
                            ? ` · ends ${new Date(l.endsAt).toLocaleDateString()}`
                            : l.endsAt
                              ? ` · renews ${new Date(l.endsAt).toLocaleDateString()}`
                              : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                          active ? "bg-primary/15 text-primary" : "bg-secondary text-ink-soft"
                        }`}
                      >
                        {active ? <BadgeCheck className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        {active ? "Active" : "Revoked"}
                      </span>
                      <button onClick={() => printCertificate(l)} className="btn-secondary h-9">
                        <Printer className="mr-2 h-4 w-4" /> Certificate
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-ink-soft">
                    <p className="text-ink">
                      {l.terms.summary ??
                        "You may sell physical prints made from files in this tier while this membership is active."}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• Unit limit: {l.terms.unitsLimit ? `${l.terms.unitsLimit} per year` : "unlimited"}</li>
                      <li>• Attribution: {l.terms.attributionRequired ? "required" : "not required"}</li>
                      <li>• Digital redistribution of the source files is never permitted.</li>
                      <li>• Licence ends if this membership lapses; items already sold stay licensed.</li>
                    </ul>
                    {l.terms.terms && (
                      <p className="whitespace-pre-line rounded-lg border border-border bg-card p-3 text-xs">
                        {l.terms.terms}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {personal.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Personal-use memberships</h2>
            <div className="mt-3 grid gap-3">
              {personal.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="font-semibold text-ink">
                    {r.creator_profiles?.display_name ?? "Creator"} · {r.creator_tiers?.name ?? "Tier"}
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    Licensed for personal, non-commercial printing. Ask the creator about a commercial tier if you
                    want to sell your prints.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {certificate && (
        <div className="fixed inset-0 z-50 overflow-auto bg-background p-6 print:static print:p-0">
          <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 print:border-0">
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Printreon</div>
            <h1 className="mt-2 text-2xl font-bold text-ink">Commercial licence certificate</h1>
            <p className="mt-1 font-mono text-sm text-ink-soft">{certificate.licenceNumber}</p>

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Licensee" value={licensee} />
              <Row label="Creator" value={certificate.creatorName} />
              <Row label="Tier" value={certificate.tierName} />
              <Row
                label="Rate at issue"
                value={money(certificate.terms.price, certificate.terms.currency, certificate.terms.interval) ?? "—"}
              />
              <Row label="Issued" value={new Date(certificate.issuedAt).toLocaleDateString()} />
              <Row
                label="Status"
                value={
                  certificate.status === "active"
                    ? certificate.endsAt
                      ? `Active until ${new Date(certificate.endsAt).toLocaleDateString()}`
                      : "Active"
                    : `Revoked ${certificate.revokedAt ? new Date(certificate.revokedAt).toLocaleDateString() : ""}`
                }
              />
              <Row
                label="Unit limit"
                value={certificate.terms.unitsLimit ? `${certificate.terms.unitsLimit} per year` : "Unlimited"}
              />
              <Row label="Attribution" value={certificate.terms.attributionRequired ? "Required" : "Not required"} />
            </dl>

            <div className="mt-6 space-y-2 text-sm text-ink-soft">
              <p className="text-ink">{certificate.terms.summary ?? "Sale of physical prints is permitted while this membership is active."}</p>
              {certificate.terms.terms && <p className="whitespace-pre-line">{certificate.terms.terms}</p>}
              <p className="text-xs">
                Digital redistribution, resale or remixing of the source files is never permitted. This certificate is
                issued by Printreon on behalf of the creator and is verifiable by licence number.
              </p>
            </div>

            <div className="mt-8 flex gap-2 print:hidden">
              <button onClick={() => window.print()} className="btn-primary h-9">
                <Printer className="mr-2 h-4 w-4" /> Print
              </button>
              <button onClick={() => setCertificate(null)} className="btn-secondary h-9">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
