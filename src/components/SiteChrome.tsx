import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { PARTNER } from "@/lib/site";

function scrollToWaitlist() {
  const el = document.getElementById("waitlist");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <button onClick={scrollToWaitlist} className="btn-primary h-9 px-4 py-2 text-sm">
          Join the waitlist
        </button>
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
            Memberships built for 3D printing creators. Launching soon.
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
