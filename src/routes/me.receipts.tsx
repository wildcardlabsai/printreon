import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MemberNav } from "@/components/MemberNav";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { Receipt, Printer } from "lucide-react";

export const Route = createFileRoute("/me/receipts")({
  head: () => ({
    meta: [
      { title: "Licence receipts — Printreon" },
      {
        name: "description",
        content: "Download printable licence receipts for every file you've downloaded on Printreon.",
      },
      { property: "og:title", content: "Licence receipts — Printreon" },
      {
        property: "og:description",
        content: "Proof of licence for the STL and 3MF files you've downloaded.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Receipts,
});

function Receipts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [commercialCreators, setCommercialCreators] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("downloads")
      .select(
        "id, downloaded_at, creator_id, creator_files(title, is_free, tier_required_id), creator_profiles(display_name, slug)"
      )
      .eq("user_id", user.id)
      .order("downloaded_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows(data ?? []));

    // Live check: which creators currently grant this member commercial rights.
    supabase
      .from("subscriptions")
      .select("creator_id, status, creator_tiers(commercial_licence)")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .then(({ data }) => {
        const set = new Set<string>();
        (data ?? []).forEach((s: any) => {
          if (s.creator_tiers?.commercial_licence) set.add(s.creator_id);
        });
        setCommercialCreators(set);
      });
  }, [user]);


  return (
    <div>
      <MemberNav />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Licence receipts</h1>
          <p className="text-sm text-ink-soft">
            Each download is licensed for personal, non-commercial printing unless the creator states otherwise.
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
          icon={Receipt}
          title="No receipts yet"
          description="Download a file and its licence receipt will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-ink">{r.creator_files?.title ?? "File"}</h2>
                <span className="text-xs text-ink-soft">
                  Receipt #{r.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                By {r.creator_profiles?.display_name ?? "Creator"} ·{" "}
                {new Date(r.downloaded_at).toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-ink-soft">
                {commercialCreators.has(r.creator_id) ? (
                  <>
                    Licence: Commercial licence — active membership with this creator grants commercial printing
                    rights. See <a href="/me/licences" className="font-semibold text-primary hover:underline">your licences</a> for the exact terms.
                  </>
                ) : (
                  <>
                    Licence:{" "}
                    {r.creator_files?.is_free
                      ? "Free download — personal use"
                      : "Membership licence — personal use"}
                    . Commercial use requires a tier that includes a commercial licence.
                  </>
                )}
              </p>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
