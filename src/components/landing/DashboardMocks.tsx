import type { ReactNode } from "react";

/* Static, hand-built UI mockups used on the landing page.
   They use the same design tokens as the real product, so what visitors
   see here matches what they get inside Printreon. All data is placeholder. */

function BrowserFrame({
  path,
  label,
  children,
  className = "",
}: {
  path: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-2xl border border-border bg-card shadow-soft ${className}`}
      aria-label={label}
      role="img"
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2" aria-hidden>
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sand" />
          <span className="h-2 w-2 rounded-full bg-sand" />
          <span className="h-2 w-2 rounded-full bg-sand" />
        </span>
        <span className="ml-1 truncate rounded-md bg-background px-2 py-0.5 font-mono text-[10px] text-ink-soft">
          {path}
        </span>
      </div>
      <div aria-hidden>{children}</div>
    </figure>
  );
}

function Bar({ h, active = false }: { h: number; active?: boolean }) {
  return (
    <span
      className={`w-full rounded-t-[3px] ${active ? "bg-primary" : "bg-primary/25"}`}
      style={{ height: `${h}%` }}
    />
  );
}

const REVENUE = [28, 36, 32, 48, 44, 61, 57, 72, 68, 84, 79, 96];

/* 1. Creator studio overview — hero */
export function MockStudioOverview() {
  return (
    <BrowserFrame
      path="printreon.com/dashboard"
      label="Printreon creator studio: monthly earnings, active supporters, published files and a revenue chart"
    >
      <div className="flex">
        <div className="hidden w-36 shrink-0 border-r border-border bg-surface p-3 sm:block">
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">Studio</p>
          <ul className="mt-3 space-y-1 text-[11px] text-ink-soft">
            {["Overview", "Files", "Tiers", "Supporters", "Earnings", "Payouts"].map((n, i) => (
              <li
                key={n}
                className={`rounded-md px-2 py-1.5 ${i === 0 ? "bg-primary/10 font-semibold text-primary" : ""}`}
              >
                {n}
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-bold text-ink">Overview</h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Sept</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { k: "Earnings", v: "£1,284" },
              { k: "Supporters", v: "213" },
              { k: "Files", v: "48" },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border border-border bg-background p-2.5">
                <p className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">{s.k}</p>
                <p className="mt-1 text-base font-bold text-ink sm:text-lg">{s.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-widest text-ink-soft">
                Subscription revenue
              </p>
              <p className="font-mono text-[9px] text-primary">+18%</p>
            </div>
            <div className="mt-3 flex h-20 items-end gap-1">
              {REVENUE.map((h, i) => (
                <Bar key={i} h={h} active={i === REVENUE.length - 1} />
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              ["New supporter · Forge tier", "£6.00"],
              ["Renewal · Workshop tier", "£12.00"],
              ["New supporter · Forge tier", "£6.00"],
            ].map(([a, b], i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[11px]"
              >
                <span className="truncate text-ink-soft">{a}</span>
                <span className="font-mono font-semibold text-ink">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* 2. File library */
const FILES = [
  { n: "articulated-dragon-v3.3mf", b: "Print-Tested", t: "Workshop", s: "24 MB" },
  { n: "modular-desk-tray.stl", b: "Digital Sculpt", t: "Forge", s: "8 MB" },
  { n: "terrain-pack-sept.zip", b: "Print-Tested", t: "Workshop", s: "112 MB" },
  { n: "bust-study-01.obj", b: "AI-Assisted", t: "Free", s: "15 MB" },
] as const;

export function MockFileLibrary() {
  return (
    <BrowserFrame
      path="printreon.com/dashboard/files"
      label="Printreon file library: STL, 3MF, OBJ and ZIP uploads with quality badges and tier gating"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Files</h3>
          <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
            Upload
          </span>
        </div>
        <div className="mt-3 divide-y divide-border border-y border-border">
          {FILES.map((f) => (
            <div key={f.n} className="flex items-center gap-3 py-2.5">
              <span className="h-8 w-8 shrink-0 rounded-md bg-surface" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[11px] text-ink">{f.n}</p>
                <p className="mt-0.5 text-[10px] text-ink-soft">
                  {f.s} · {f.t} tier
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide text-primary">
                {f.b}
              </span>
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

/* 3. Tiers editor */
const TIERS = [
  { n: "Forge", p: "£6", d: "Every monthly release, print-ready.", on: false },
  { n: "Workshop", p: "£12", d: "Releases, source files and commercial licence.", on: true },
] as const;

export function MockTiers() {
  return (
    <BrowserFrame
      path="printreon.com/dashboard/tiers"
      label="Printreon tier editor: membership tiers with monthly and annual pricing"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Tiers</h3>
          <span className="inline-flex overflow-hidden rounded-md border border-border font-mono text-[9px]">
            <span className="bg-ink px-2 py-1 text-background">Monthly</span>
            <span className="px-2 py-1 text-ink-soft">Annual</span>
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {TIERS.map((t) => (
            <div
              key={t.n}
              className={`rounded-xl border p-3 ${t.on ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}
            >
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-bold text-ink">{t.n}</p>
                <p className="font-mono text-sm font-bold text-ink">
                  {t.p}
                  <span className="text-[9px] font-normal text-ink-soft">/mo</span>
                </p>
              </div>
              <p className="mt-1 text-[10px] text-ink-soft">{t.d}</p>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-border p-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            + Add tier
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* 4. Supporter library */
const UNLOCKED = ["articulated-dragon-v3.3mf", "terrain-pack-sept.zip", "modular-desk-tray.stl"] as const;

export function MockSupporterLibrary() {
  return (
    <BrowserFrame
      path="printreon.com/me/library"
      label="Supporter library: unlocked files with secure download links"
    >
      <div className="p-4">
        <h3 className="text-sm font-bold text-ink">Your library</h3>
        <p className="mt-0.5 text-[10px] text-ink-soft">Unlocked by 2 memberships</p>
        <div className="mt-3 space-y-2">
          {UNLOCKED.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
            >
              <span className="h-6 w-6 shrink-0 rounded bg-surface" />
              <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-ink">{f}</span>
              <span className="shrink-0 rounded-md bg-ink px-2 py-1 text-[9px] font-semibold text-background">
                Download
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-ink-soft">
          Signed links · expire in 15 min
        </p>
      </div>
    </BrowserFrame>
  );
}
