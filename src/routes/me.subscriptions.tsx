import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { cancelSubscription, resumeSubscription } from "@/functions/subscriptions.functions";
import { createBillingPortalSession } from "@/functions/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { Heart, ArrowRight, AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/me/subscriptions")({
  component: SubsPage,
});

function SubsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<any[] | null>(null);
  const cancel = useServerFn(cancelSubscription);
  const resume = useServerFn(resumeSubscription);
  const portal = useServerFn(createBillingPortalSession);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("*, creator_profiles(display_name, slug, profile_image_url), creator_tiers(name, price)")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false });
    setSubs(data ?? []);
  };
  useEffect(() => { refresh(); }, [user]);

  const onCancel = async (id: string) => {
    if (!confirm("Cancel this subscription at the end of the period?")) return;
    try { await cancel({ data: { subscriptionId: id, environment: getStripeEnvironment() } }); toast.success("Canceled"); refresh(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const onResume = async (id: string) => {
    try { await resume({ data: { subscriptionId: id, environment: getStripeEnvironment() } }); toast.success("Resumed"); refresh(); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };
  const onPortal = async () => {
    try {
      const { url } = await portal({ data: { returnUrl: window.location.href, environment: getStripeEnvironment() } });
      window.open(url, "_blank");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  if (subs === null) return <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="card-soft h-32 animate-pulse" />)}</div>;

  if (subs.length === 0) {
    return (
      <div className="card-soft text-center">
        <Heart className="mx-auto h-10 w-10 text-primary" />
        <h3 className="mt-3 text-xl font-bold text-ink">No subscriptions yet</h3>
        <p className="mt-1 text-ink-soft">Find creators worth supporting and unlock their files.</p>
        <Link to="/explore" className="btn-primary mt-5 inline-flex">Explore creators <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button onClick={onPortal} className="btn-ghost h-9 px-3 text-sm"><CreditCard className="mr-2 h-4 w-4" />Manage billing</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      {subs.map((s) => {
        const cp = s.creator_profiles;
        return (
          <div key={s.id} className="card-soft">
            <div className="flex items-center gap-3">
              {cp?.profile_image_url ? (
                <img src={cp.profile_image_url} className="h-12 w-12 rounded-full object-cover" alt="" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center font-bold">{cp?.display_name?.[0]}</div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-ink">{cp?.display_name ?? "Creator"}</div>
                <div className="text-xs text-ink-soft">
                  {s.creator_tiers?.name ?? "Tier"} · ${Number(s.creator_tiers?.price ?? 0).toFixed(0)}/mo · <span className="capitalize">{s.status}</span>
                </div>
              </div>
            </div>
            {s.cancel_at_period_end && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary p-2 text-xs text-ink-soft">
                <AlertTriangle className="h-3 w-3 text-primary" /> Will end at the end of the current period.
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {cp?.slug && <Link to="/c/$slug" params={{ slug: cp.slug }} className="btn-ghost h-9 px-3 text-sm">View page</Link>}
              {s.status === "active" && !s.cancel_at_period_end && (
                <button onClick={() => onCancel(s.id)} className="btn-ghost h-9 px-3 text-sm text-destructive hover:bg-destructive/10">Cancel</button>
              )}
              {(s.cancel_at_period_end || s.status === "canceled") && (
                <button onClick={() => onResume(s.id)} className="btn-primary h-9 px-3 text-sm">Resume</button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </>
  );
}
