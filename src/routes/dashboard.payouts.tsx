import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { Banknote, Info, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/payouts")({
  component: PayoutsPage,
});

function PayoutsPage() {
  const { creator } = useCreatorProfile();
  const [mrr, setMrr] = useState(0);
  const [active, setActive] = useState(0);

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

  if (!creator) return null;

  const fee = Number(creator.platform_fee_percentage ?? 10);
  const grossMonthly = mrr;
  const netMonthly = mrr * (1 - fee / 100);
  const status = creator.payout_status ?? "not_setup";

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
              Connect your payout account to start receiving subscriber payments. Funds settle monthly to your bank.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-ink-soft"}`}>
            {status === "active" ? "Active" : "Not set up"}
          </span>
        </div>

        <div className="mt-5 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-ink-soft">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Info className="h-4 w-4 text-primary" /> Payments will go live shortly
          </div>
          <p className="mt-1">
            We're activating Stripe Connect on MakerMind Club. Once enabled in your studio, subscribers can check out
            and you'll be able to verify your account and receive payouts directly from this page.
          </p>
        </div>

        <button disabled className="btn-primary mt-5 opacity-60">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Connect payout account (coming soon)
        </button>
      </div>

      <div className="card-soft mt-6">
        <h3 className="text-base font-bold text-ink">Payout schedule</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
          <li>Monthly settlement on the 1st of each month for the previous period.</li>
          <li>Minimum payout threshold: $20.</li>
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
