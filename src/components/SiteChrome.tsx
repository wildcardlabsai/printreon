import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { PARTNER } from "@/lib/site";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "founder-benefits", label: "Founder Benefits" },
  { id: "beta-access", label: "Beta Access" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    if (pathname !== "/") {
      navigate({ to: "/", hash: id });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary sm:inline-flex font-mono">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Invite-only beta
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          {NAV_LINKS.map((link) => (
            <button key={link.id} onClick={() => scrollTo(link.id)} className="hover:text-ink transition">
              {link.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollTo("beta-access")}
            className="btn-primary h-9 px-4 py-2 text-sm whitespace-nowrap"
          >
            Apply For Beta
          </button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <SheetContent side="right" className="flex w-4/5 flex-col gap-1 sm:max-w-xs">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1 text-base font-medium text-ink">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="rounded-lg px-3 py-3 text-left hover:bg-secondary"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
              <SheetClose asChild>
                <button
                  onClick={() => scrollTo("beta-access")}
                  className="btn-primary mt-4 h-11 w-full text-sm"
                >
                  Apply For Beta
                </button>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            Memberships built for 3D printing creators. Now accepting founding-creator beta applications.
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            In partnership with{" "}
            <a href={PARTNER.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
              {PARTNER.name}
            </a>
            .
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
          <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
          <li><Link to="/legal/terms" className="hover:text-ink">Terms</Link></li>
          <li><Link to="/legal/privacy" className="hover:text-ink">Privacy</Link></li>
          <li><Link to="/legal/dmca" className="hover:text-ink">DMCA</Link></li>
          <li><Link to="/legal/creator-agreement" className="hover:text-ink">Creator Agreement</Link></li>
        </ul>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-5 text-center text-xs text-ink-soft">
          © {new Date().getFullYear()} Printreon — printreon.com
        </div>
      </div>
    </footer>
  );
}
