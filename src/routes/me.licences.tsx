import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

function Licences() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("subscriptions")
      .select(
        "id, status, created_at, current_period_end, cancel_at_period_end, creator_profiles(display_name, slug), creator_tiers(name, price, billing_interval, commercial_licence, commercial_licence_summary, commercial_licence_terms, commercial_units_limit, commercial_attribution_required)"
      )
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [user]);

  const licensee = user?.email ?? "You";

  return (
    <div>
      <MemberNav />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Commercial licences</h1>
          <p className="text-sm text-ink-soft">
            Rights come from the tier you subscribe to and stay valid while that membership is active.
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary h-9">
          <Printer className="mr-2 h-4 w-4" /> Print
        </button>
      </div>

      {rows === null ? (
        <div className="text-ink-soft">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No memberships yet"
          description="Subscribe to a creator and any commercial rights included in their tier will show up here."
        />
      ) : (
        <div className="grid gap-4">
          {rows.map((r) => {
            const t = r.creator_tiers ?? {};
            const commercial = !!t.commercial_licence;
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-5 ${commercial ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-ink">
                      {r.creator_profiles?.display_name ?? "Creator"} · {t.name ?? "Tier"}
                    </h2>
                    <p className="mt-1 text-xs text-ink-soft">
                      Licensee {licensee} · active since{" "}
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"} · status {r.status}
                      {r.cancel_at_period_end && r.current_period_end
                        ? ` · ends ${new Date(r.current_period_end).toLocaleDateString()}`
                        : r.current_period_end
                          ? ` · renews ${new Date(r.current_period_end).toLocaleDateString()}`
                          : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      commercial ? "bg-primary/15 text-primary" : "bg-secondary text-ink-soft"
                    }`}
                  >
                    {commercial ? <BadgeCheck className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {commercial ? "Commercial licence" : "Personal use only"}
                  </span>
                </div>

                {commercial ? (
                  <div className="mt-4 space-y-2 text-sm text-ink-soft">
                    <p className="text-ink">
                      {t.commercial_licence_summary ??
                        "You may sell physical prints made from files in this tier while this membership is active."}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • Unit limit:{" "}
                        {t.commercial_units_limit ? `${t.commercial_units_limit} per year` : "unlimited"}
                      </li>
                      <li>
                        • Attribution: {t.commercial_attribution_required ? "required" : "not required"}
                      </li>
                      <li>• Digital redistribution of the source files is never permitted.</li>
                      <li>• Licence ends if this membership lapses; items already sold stay licensed.</li>
                    </ul>
                    {t.commercial_licence_terms && (
                      <p className="whitespace-pre-line rounded-lg border border-border bg-card p-3 text-xs">
                        {t.commercial_licence_terms}
                      </p>
                    )}
                    <p className="text-[11px]">Certificate ref #{r.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-ink-soft">
                    This tier is licensed for personal, non-commercial printing. Ask the creator about a
                    commercial tier if you want to sell your prints.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
