import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BarChart3, ClipboardList, Mail, Users, Star, CreditCard, FileBox,
  DollarSign, LifeBuoy, Megaphone, Flag, Activity, HeartPulse, Settings, Shield, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const items = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/preregistrations", label: "Preregistrations", icon: ClipboardList },
  { to: "/admin/invites", label: "Invites", icon: Mail },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/creators", label: "Creators", icon: Star },
  { to: "/admin/memberships", label: "Memberships", icon: CreditCard },
  { to: "/admin/stl-library", label: "STL Library", icon: FileBox },
  { to: "/admin/payments", label: "Payments", icon: DollarSign },
  { to: "/admin/revenue", label: "Revenue", icon: BarChart3 },
  { to: "/admin/reports", label: "Moderation", icon: Flag },
  { to: "/admin/emails", label: "Emails", icon: Mail },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/feature-flags", label: "Feature Flags", icon: Flag },
  { to: "/admin/activity-log", label: "Activity Log", icon: Activity },
  { to: "/admin/system-health", label: "System Health", icon: HeartPulse },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex-1 overflow-y-auto p-2 text-sm">
      {items.map((it) => {
        const active = it.exact ? path === it.to : path === it.to || path.startsWith(it.to + "/");
        return (
          <Link
            key={it.to}
            to={it.to}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-md px-3 py-2 mb-0.5 ${
              active ? "bg-primary/10 text-primary font-semibold" : "text-ink-soft hover:bg-secondary"
            }`}
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold">Printreon Admin</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {/* Spacer to offset fixed mobile bar */}
      <div className="md:hidden h-14 shrink-0" aria-hidden />

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex w-72 max-w-[85vw] flex-col bg-card border-r border-border">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-bold">Printreon Admin</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setOpen(false)} />
            <div className="border-t border-border p-3 text-xs text-ink-soft">
              <div className="truncate mb-2">{user?.email}</div>
              <button onClick={() => signOut()} className="flex items-center gap-1 hover:text-ink">
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold">Printreon Admin</span>
        </div>
        <NavList />
        <div className="border-t border-border p-3 text-xs text-ink-soft">
          <div className="truncate mb-2">{user?.email}</div>
          <button onClick={() => signOut()} className="flex items-center gap-1 hover:text-ink">
            <LogOut className="h-3 w-3" /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
