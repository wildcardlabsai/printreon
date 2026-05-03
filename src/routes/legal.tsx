import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/legal")({
  component: LegalLayout,
});

function LegalLayout() {
  const loc = useLocation();
  const items: Array<{ to: "/legal/terms" | "/legal/privacy" | "/legal/dmca" | "/legal/creator-agreement"; label: string }> = [
    { to: "/legal/terms", label: "Terms of Service" },
    { to: "/legal/privacy", label: "Privacy Policy" },
    { to: "/legal/dmca", label: "DMCA" },
    { to: "/legal/creator-agreement", label: "Creator Agreement" },
  ];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page grid gap-8 py-12 md:grid-cols-[220px_1fr]">
        <aside>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Legal</h2>
          <nav className="mt-3 space-y-1">
            {items.map((i) => (
              <Link key={i.to} to={i.to} className={`block rounded-md px-3 py-2 text-sm ${loc.pathname === i.to ? "bg-accent text-primary font-semibold" : "text-ink-soft hover:text-ink"}`}>
                {i.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="prose max-w-none">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
