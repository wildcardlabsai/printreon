import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { useServerFn } from "@tanstack/react-start";
import {
  startConnectOnboarding,
  refreshConnectStatus,
  openExpressDashboard,
} from "@/server/connect.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { Banknote, Info, CheckCircle2, ExternalLink, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/payouts")({
  component: PayoutsPage,
});

function PayoutsPage() {
  const { creator, refresh: refreshCreator } = useCreatorProfile();
  const [mrr, setMrr] = useState(0);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState<"start" | "refresh" | "dash" | null>(null);
  const [requirements, setRequirements] = useState<string[]>([]);

  const start = useServerFn(startConnectOnboarding);
  const refreshStatus = useServerFn(refreshConnectStatus);
  const openDash = useServerFn(openExpressDashboard);
  const env = getStripeEnvironment();

  useEffect(() => {
    if (!creator) return;
    supabase
      .from("subscriptions")
      .select("status, creator_tiers(price)")
      .eq("creator_id", creator.id)
      .eq("status", "active")
      .then(({ data }) => {
        setActive(data?.length ?? 0);
        setMrr((data ?? []).reduce((s, r: any) => s + Number(r.creator_tiers?.price ?? 0), 0));
      });
  }, [creator]);

  // Auto-refresh status when arriving back from Stripe
  useEffect(() => {
    if (!creator?.connected_account_id) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("connect") === "return") {
      handleRefresh();
      url.searchParams.delete("connect");
      window.history.replaceState({}, "", url.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator?.connected_account_id]);

  if (!creator) return null;

  const fee = Number(creator.platform_fee_percentage ?? 10);
  const grossMonthly = mrr;
  const netMonthly = mrr * (1 - fee / 100);
  const status = creator.payout_status ?? "not_setup";

  async function handleStart() {
    try {
      setBusy("start");
      const base = window.location.origin + "/dashboard/payouts";
      const { url } = await start({
        data: {
          environment: env,
          returnUrl: `${base}?connect=return`,
          refreshUrl: `${base}?connect=refresh`,
        },
      });
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start onboarding");
      setBusy(null);
    }
  }

  async function handleRefresh() {
    try {
      setBusy("refresh");
      const r = await refreshStatus({ data: { environment: env } });
      setRequirements(r.requirements ?? []);
      await refreshCreator?.();
      toast.success(`Status: ${r.status}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Refresh failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleOpenDash() {
    try {
      setBusy("dash");
      const { url } = await openDash({ data: { environment: env } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open dashboard");
    } finally {
      setBusy(null);
    }
  }

  const statusBadge =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "pending"
        ? "bg-amber-100 text-amber-700"
        : status === "incomplete"
          ? "bg-amber-100 text-amber-700"
          : "bg-secondary text-ink-soft";

  const statusLabel =
    status === "active"
      ? "Active"
      : status === "pending"
        ? "Pending review"
        : status === "incomplete"
          ? "Incomplete"
          : "Not set up";

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Active subscribers" value={active} />
        <Stat label="Gross monthly" value={`$${grossMonthly.toFixed(2)}`} />
        <Stat label="Estimated payout" value={`$${netMonthly.toFixed(2)}`} sub={`After ${fee}% platform fee`} />
      </div>

      <div className="card-soft mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" /> Payout setup
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Connect your payout account to start receiving subscriber payments. Funds settle to your bank on Stripe's standard schedule.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusBadge}`}>
            {statusLabel}
          </span>
        </div>

        {status === "active" && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> You're all set
            </div>
            <p className="mt-1">Subscriber payments are routed to your connected account. Platform fee: {fee}%.</p>
          </div>
        )}

        {status !== "active" && status !== "not_setup" && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" /> Almost there
            </div>
            <p className="mt-1">
              Stripe still needs a few details before you can receive payouts.
              {requirements.length > 0 && (
                <> Missing: <span className="font-semibold">{requirements.join(", ")}</span></>
              )}
            </p>
          </div>
        )}

        {status === "not_setup" && (
          <div className="mt-5 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-ink-soft">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <Info className="h-4 w-4 text-primary" /> Powered by Stripe Connect
            </div>
            <p className="mt-1">
              You'll be redirected to Stripe to verify your identity and link a bank account. Takes about 3 minutes.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {status === "not_setup" ? (
            <button onClick={handleStart} disabled={busy === "start"} className="btn-primary">
              {busy === "start" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Connect payout account
            </button>
          ) : (
            <>
              <button onClick={handleStart} disabled={busy === "start"} className="btn-primary">
                {busy === "start" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                {status === "active" ? "Update account" : "Continue onboarding"}
              </button>
              <button onClick={handleRefresh} disabled={busy === "refresh"} className="btn-ghost">
                {busy === "refresh" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh status
              </button>
              {status === "active" && (
                <button onClick={handleOpenDash} disabled={busy === "dash"} className="btn-ghost">
                  {busy === "dash" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Open Stripe dashboard
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="card-soft mt-6">
        <h3 className="text-base font-bold text-ink">Payout schedule</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
          <li>Payouts run on Stripe's standard schedule once your account is active.</li>
          <li>MakerMind takes a {fee}% platform fee on each subscription payment.</li>
          <li>Refunds and chargebacks are netted from upcoming payouts.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="card-soft">
      <div className="text-xs font-semibold uppercase text-ink-soft">{label}</div>
      <div className="mt-2 text-3xl font-bold text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-soft">{sub}</div>}
    </div>
  );
}
