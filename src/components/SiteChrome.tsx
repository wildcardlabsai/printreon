import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-context";

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
              {isAdmin && <Link to="/admin" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline">Admin</Link>}
              <Link to={isCreator ? "/dashboard" : "/me"} className="btn-ghost h-9 px-3 py-2 text-sm">
                Dashboard
              </Link>
              <button onClick={signOut} className="text-sm font-medium text-ink-soft hover:text-ink">
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
      <div className="container-page flex flex-col items-start justify-between gap-6 py-10 md:flex-row md:items-center">
        <Logo />
        <p className="text-sm text-ink-soft">© {new Date().getFullYear()} MakerMind Club. Built for 3D creators.</p>
        <div className="flex gap-6 text-sm text-ink-soft">
          <Link to="/explore" className="hover:text-ink">Explore</Link>
          <Link to="/for-creators" className="hover:text-ink">For Creators</Link>
          <Link to="/pricing" className="hover:text-ink">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}
