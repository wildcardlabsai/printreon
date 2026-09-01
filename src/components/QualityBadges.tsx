import { BadgeCheck, Bot, Hand, Sparkles } from "lucide-react";
import { creationMethodLabel } from "@/lib/mesh-preview";

export function CreationMethodBadge({ method, className = "" }: { method: string | null | undefined; className?: string }) {
  const label = creationMethodLabel(method);
  if (!label) return null;
  const Icon = method === "hand" ? Hand : method === "ai_assisted" ? Sparkles : Bot;
  const tone =
    method === "hand"
      ? "bg-emerald-500/12 text-emerald-700"
      : method === "ai_assisted"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-secondary text-ink-soft";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone} ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function PrintVerifiedBadge({ verifiedAt, className = "" }: { verifiedAt?: string | null; className?: string }) {
  if (!verifiedAt) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary ${className}`}>
      <BadgeCheck className="h-3 w-3" />
      Print verified
    </span>
  );
}

export function SuccessRateBadge({
  total,
  successRate,
  className = "",
}: {
  total: number;
  successRate: number | null;
  className?: string;
}) {
  if (!total || total < 3 || successRate == null) return null;
  const pct = Math.round(successRate * 100);
  const tone = pct >= 80 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-destructive";
  return (
    <span className={`text-[11px] font-semibold ${tone} ${className}`}>
      {pct}% printed successfully ({total} reports)
    </span>
  );
}

export function ReviewStatusBadge({ status, className = "" }: { status?: string | null; className?: string }) {
  if (!status || status === "not_required" || status === "approved") return null;
  const map: Record<string, { label: string; tone: string }> = {
    pending: { label: "In review", tone: "bg-amber-500/15 text-amber-700" },
    flagged: { label: "Flagged", tone: "bg-destructive/12 text-destructive" },
    rejected: { label: "Rejected", tone: "bg-destructive/12 text-destructive" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.tone} ${className}`}>
      {s.label}
    </span>
  );
}
