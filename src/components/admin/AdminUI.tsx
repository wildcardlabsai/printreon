import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-soft mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-ink-soft font-semibold">{label}</div>
      <div className="text-2xl font-bold text-ink mt-1">{value}</div>
      {hint && <div className="text-xs text-ink-soft mt-1">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <h3 className="font-semibold text-ink">{title}</h3>
      {description && <p className="text-sm text-ink-soft mt-1">{description}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    shortlisted: "bg-blue-500/10 text-blue-600",
    invited: "bg-violet-500/10 text-violet-600",
    accepted: "bg-emerald-500/10 text-emerald-600",
    active: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-red-500/10 text-red-600",
    waitlist: "bg-slate-500/10 text-slate-600",
    open: "bg-amber-500/10 text-amber-600",
    closed: "bg-slate-500/10 text-slate-600",
    resolved: "bg-emerald-500/10 text-emerald-600",
    used: "bg-slate-500/10 text-slate-600",
    expired: "bg-red-500/10 text-red-600",
    revoked: "bg-red-500/10 text-red-600",
    draft: "bg-slate-500/10 text-slate-600",
    published: "bg-emerald-500/10 text-emerald-600",
    archived: "bg-slate-500/10 text-slate-600",
    paused: "bg-amber-500/10 text-amber-600",
    suspended: "bg-red-500/10 text-red-600",
    hidden: "bg-slate-500/10 text-slate-600",
    flagged: "bg-red-500/10 text-red-600",
    high: "bg-orange-500/10 text-orange-600",
    urgent: "bg-red-500/10 text-red-600",
    normal: "bg-blue-500/10 text-blue-600",
    low: "bg-slate-500/10 text-slate-600",
  };
  const cls = map[status] ?? "bg-secondary text-ink-soft";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{status}</span>;
}

export function exportCsv(filename: string, rows: any[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
