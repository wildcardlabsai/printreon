import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Menu, ChevronDown, ShoppingBag, Palette, Shield, LogOut, MessageSquare } from "lucide-react";
import { Logo } from "./Logo";
import { PARTNER } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "founder-benefits", label: "Founder Benefits" },
  { id: "beta-access", label: "Beta Access" },
] as const;

export function SiteHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isCreator, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate({ to: "/", replace: true });
  };


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
          <Link to="/explore" className="hover:text-ink transition">Explore</Link>
          <Link to="/pricing" className="hover:text-ink transition">Pricing</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-ink hover:bg-secondary">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold uppercase text-primary">
                  {(user.email ?? "?").slice(0, 1)}
                </span>
                <span className="hidden max-w-[10rem] truncate sm:inline">{user.email}</span>
                <ChevronDown className="h-4 w-4 text-ink-soft" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/me"><ShoppingBag className="mr-2 h-4 w-4" /> My account</Link>
                </DropdownMenuItem>
                {isCreator && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard"><Palette className="mr-2 h-4 w-4" /> Creator studio</Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><Shield className="mr-2 h-4 w-4" /> Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/feedback"><MessageSquare className="mr-2 h-4 w-4" /> Send feedback</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth" className="hidden text-sm font-medium text-ink-soft hover:text-ink sm:inline">
                Sign in
              </Link>
              <button
                onClick={() => scrollTo("beta-access")}
                className="btn-primary h-9 px-4 py-2 text-sm whitespace-nowrap"
              >
                Apply For Beta
              </button>
            </>
          )}



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
              {user ? (
                <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-base font-medium text-ink">
                  <SheetClose asChild>
                    <Link to="/me" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-secondary">
                      <ShoppingBag className="h-4 w-4" /> My account
                    </Link>
                  </SheetClose>
                  {isCreator && (
                    <SheetClose asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-secondary">
                        <Palette className="h-4 w-4" /> Creator studio
                      </Link>
                    </SheetClose>
                  )}
                  {isAdmin && (
                    <SheetClose asChild>
                      <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-secondary">
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    </SheetClose>
                  )}
                  <SheetClose asChild>
                    <Link to="/feedback" className="flex items-center gap-2 rounded-lg px-3 py-3 hover:bg-secondary">
                      <MessageSquare className="h-4 w-4" /> Send feedback
                    </Link>
                  </SheetClose>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : (
                <SheetClose asChild>
                  <button
                    onClick={() => scrollTo("beta-access")}
                    className="btn-primary mt-4 h-11 w-full text-sm"
                  >
                    Apply For Beta
                  </button>
                </SheetClose>
              )}

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
          <li><Link to="/changelog" className="hover:text-ink">Changelog</Link></li>
          <li><Link to="/roadmap" className="hover:text-ink">Roadmap</Link></li>
          <li><Link to="/feedback" className="hover:text-ink">Feedback</Link></li>
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
