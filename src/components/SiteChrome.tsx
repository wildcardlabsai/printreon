import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";
import { PARTNER } from "@/lib/site";
import { LayoutDashboard, ShoppingBag, Plus } from "lucide-react";

export function SiteHeader() {
  const { user, isCreator, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <Link to="/explore" className="hover:text-ink">Explore</Link>
          <Link to="/for-creators" className="hover:text-ink">For Creators</Link>
          <Link to="/pricing" className="hover:text-ink">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline">
                  Admin
                </Link>
              )}
              <Link to="/me" className="btn-ghost h-9 px-3 py-2 text-sm" title="Your buyer account">
                <ShoppingBag className="mr-1.5 h-4 w-4" /> My account
              </Link>
              {isCreator ? (
                <Link to="/dashboard" className="btn-primary h-9 px-3 py-2 text-sm" title="Your creator studio">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" /> Creator studio
                </Link>
              ) : (
                <Link
                  to="/onboarding/creator"
                  className="hidden text-sm font-medium text-primary hover:underline sm:inline-flex sm:items-center"
                  title="Open a creator studio"
                >
                  <Plus className="mr-1 h-4 w-4" /> Become a creator
                </Link>
              )}
              <button onClick={signOut} className="ml-1 text-sm font-medium text-ink-soft hover:text-ink">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-ink-soft hover:text-ink">Sign in</Link>
              <Link to="/auth" search={{ mode: "signup" }} className="btn-primary h-9 px-4 py-2 text-sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            Memberships built for 3D printing creators. Sell STL, 3MF, OBJ &amp; ZIP files through monthly subscriptions.
          </p>
          <p className="mt-4 text-xs text-ink-soft">
            In partnership with{" "}
            <a href={PARTNER.url} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
              {PARTNER.name}
            </a>{" "}
            — {PARTNER.tagline}.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink">Platform</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link to="/explore" className="hover:text-ink">Explore</Link></li>
            <li><Link to="/for-creators" className="hover:text-ink">For Creators</Link></li>
            <li><Link to="/pricing" className="hover:text-ink">Pricing</Link></li>
            <li><Link to="/blog" className="hover:text-ink">Blog</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink">Company</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link to="/about" className="hover:text-ink">About</Link></li>
            <li><Link to="/changelog" className="hover:text-ink">Changelog</Link></li>
            <li><Link to="/roadmap" className="hover:text-ink">Roadmap</Link></li>
            <li><Link to="/press" className="hover:text-ink">Press</Link></li>
            <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
            <li><Link to="/help" className="hover:text-ink">Help</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink">Legal</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link to="/legal/terms" className="hover:text-ink">Terms</Link></li>
            <li><Link to="/legal/privacy" className="hover:text-ink">Privacy</Link></li>
            <li><Link to="/legal/dmca" className="hover:text-ink">DMCA</Link></li>
            <li><Link to="/legal/creator-agreement" className="hover:text-ink">Creator Agreement</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-ink-soft md:flex-row">
          <p>© {new Date().getFullYear()} Printreon — printreon.com</p>
          <p>Made for 3D printing creators worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
