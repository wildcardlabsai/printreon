import { PARTNER } from "@/lib/site";

export function PartnerStrip({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <p className="text-xs text-ink-soft">
        Officially partnered with{" "}
        <a href={PARTNER.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
          {PARTNER.name}
        </a>
      </p>
    );
  }
  return (
    <div className="container-page py-6">
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 text-center md:flex-row md:gap-4 md:text-left">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">In partnership with</span>
        <a
          href={PARTNER.url}
          target="_blank"
          rel="noreferrer"
          className="text-base font-bold text-ink hover:text-primary"
        >
          {PARTNER.name}
        </a>
        <span className="text-sm text-ink-soft">— {PARTNER.tagline}</span>
      </div>
    </div>
  );
}
