import { BadgeCheck, Bot, Hand } from "lucide-react";
import { fileBadge } from "@/lib/mesh-preview";

const TONE: Record<string, string> = {
  print_tested: "bg-primary/12 text-primary",
  digital_sculpt: "bg-emerald-500/12 text-emerald-700",
  ai_assisted: "bg-amber-500/15 text-amber-800",
};

const ICON = {
  print_tested: BadgeCheck,
  digital_sculpt: Hand,
  ai_assisted: Bot,
} as const;

/**
 * The single badge shown for a file: Print-Tested (a real print photo is
 * attached), otherwise Digital Sculpt or AI-Assisted.
 */
export function FileBadge({
  file,
  className = "",
}: {
  file: { creation_method?: string | null; print_verified_at?: string | null };
  className?: string;
}) {
  const badge = fileBadge(file);
  if (!badge) return null;
  const Icon = ICON[badge.key];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TONE[badge.key]} ${className}`}>
      <Icon className="h-3 w-3" />
      {badge.label}
    </span>
  );
}

/** Origin badge only — used where the print status is shown separately. */
export function CreationMethodBadge({
  method,
  className = "",
}: {
  method: string | null | undefined;
  className?: string;
}) {
  return <FileBadge file={{ creation_method: method }} className={className} />;
}

export function PrintVerifiedBadge({ verifiedAt, className = "" }: { verifiedAt?: string | null; className?: string }) {
  if (!verifiedAt) return null;
  return <FileBadge file={{ print_verified_at: verifiedAt }} className={className} />;
}

/** One-line explainer buyers can read next to a grid of files. */
export function BadgeLegend({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-ink-soft ${className}`}>
      <strong className="text-ink">Print-Tested</strong> — physically printed by the creator ·{" "}
      <strong className="text-ink">Digital Sculpt</strong> — hand-crafted, watertight, slicer-ready ·{" "}
      <strong className="text-ink">AI-Assisted</strong> — AI base, manually retopologised and repaired. Raw AI exports aren't allowed.
    </p>
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
