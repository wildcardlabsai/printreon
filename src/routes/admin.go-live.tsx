import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader, StatCard } from "@/components/admin/AdminUI";
import { adminStripeReadiness } from "@/functions/ops.functions";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/go-live")({
  component: GoLive,
  head: () => ({
    meta: [
      { title: "Go-live readiness · Printreon admin" },
      { name: "description", content: "Check Stripe keys, webhook activity, scheduled jobs and payout readiness before taking real payments." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type State = "ok" | "warn" | "fail";

function Row({ label, state, note }: { label: string; state: State; note: string }) {
  const Icon = state === "ok" ? CheckCircle2 : state === "warn" ? AlertCircle : XCircle;
  const color = state === "ok" ? "text-emerald-600" : state === "warn" ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <div>
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="text-xs text-ink-soft">{note}</div>
      </div>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
    </div>
  );
}

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "never");

function GoLive() {
  const load = useServerFn(adminStripeReadiness);
  const [r, setR] = useState<any>(null);

  useEffect(() => {
    load({})
      .then(setR)
      .catch((e: any) => toast.error(e?.message ?? "Could not load readiness"));
  }, [load]);

  if (!r) return <div className="p-8 text-ink-soft">Running checks…</div>;

  const env = r.liveReady ? "live" : "test";

  return (
    <div className="p-8">
      <PageHeader
        title="Go-live readiness"
        subtitle="Everything that must be true before Printreon takes real money."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active environment" value={env === "live" ? "Live" : "Test"} hint={env === "live" ? "Real cards are charged" : "Sandbox cards only"} />
        <StatCard label="Live subscriptions" value={r.liveSubscriptions} />
        <StatCard label="Tiers with a price" value={`${r.tiers.withStripePrice}/${r.tiers.total}`} hint="Active tiers linked to Stripe" />
        <StatCard label="Payout-ready creators" value={`${r.payouts.payoutReady}/${r.payouts.publishedCreators}`} hint="Connect onboarding complete" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-lg font-semibold text-ink">Credentials</h2>
          <Row label="Test API key" state={r.keys.sandboxApiKey ? "ok" : "fail"} note="STRIPE_SANDBOX_API_KEY" />
          <Row label="Test webhook secret" state={r.keys.sandboxWebhookSecret ? "ok" : "warn"} note="PAYMENTS_SANDBOX_WEBHOOK_SECRET" />
          <Row label="Live API key" state={r.keys.liveApiKey ? "ok" : "warn"} note="Added once Stripe approves go-live" />
          <Row label="Live webhook secret" state={r.keys.liveWebhookSecret ? "ok" : "warn"} note="Added with the live endpoint" />
          <Row label="Gateway key" state={r.keys.lovableApiKey ? "ok" : "fail"} note="Required for every Stripe call" />
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-lg font-semibold text-ink">Webhook activity</h2>
          <Row
            label="Test webhook verified"
            state={r.sandboxEvent ? "ok" : "warn"}
            note={`Last verified event: ${when(r.sandboxEvent?.occurred_at)}`}
          />
          <Row
            label="Live webhook verified"
            state={r.liveEvent ? "ok" : r.liveReady ? "fail" : "warn"}
            note={`Last verified event: ${when(r.liveEvent?.occurred_at)}`}
          />
          <Row
            label="Endpoint URL"
            state="ok"
            note="https://printreon.com/api/public/payments/webhook"
          />
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-lg font-semibold text-ink">Scheduled jobs</h2>
          {r.cronJobs && r.cronJobs.length > 0 ? (
            r.cronJobs.map((j: any) => (
              <Row
                key={j.jobname}
                label={j.jobname}
                state={j.active ? (j.last_status === "failed" ? "fail" : "ok") : "warn"}
                note={`${j.schedule} · last run ${when(j.last_run)}${j.last_status ? ` (${j.last_status})` : ""}`}
              />
            ))
          ) : (
            <Row label="No jobs registered" state="fail" note="Membership expiry and scheduled publishing will not run" />
          )}
          <Row label="Scheduler token" state={r.keys.cronToken ? "ok" : "fail"} note="Shared secret used to call the cron endpoints" />
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-2 text-lg font-semibold text-ink">Launch blockers</h2>
          <Row
            label="Creator payouts"
            state={r.payouts.payoutReady > 0 ? "ok" : "warn"}
            note="Each creator must finish Stripe Connect onboarding before they can be paid"
          />
          <Row
            label="Email delivery"
            state={r.keys.emailApiKey ? "ok" : "warn"}
            note="Needs a verified sender domain before receipts and alerts actually send"
          />
          <Row
            label="Tier prices in live mode"
            state={r.tiers.withStripePrice === r.tiers.total && r.tiers.total > 0 ? "ok" : "warn"}
            note="Sandbox prices do not carry over — recreate tiers after go-live"
          />
        </section>
      </div>
    </div>
  );
}
