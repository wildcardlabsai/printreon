import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FileBox, Layers, Users, Megaphone, Settings, BarChart3, Banknote, MessageSquare, Newspaper, Package, Tag } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/files", label: "Files", icon: FileBox },
  { to: "/dashboard/posts", label: "Posts", icon: Newspaper },
  { to: "/dashboard/bundles", label: "Bundles", icon: Package },
  { to: "/dashboard/promos", label: "Promo codes", icon: Tag },
  { to: "/dashboard/tiers", label: "Tiers", icon: Layers },
  { to: "/dashboard/subscribers", label: "Subscribers", icon: Users },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { to: "/dashboard/payouts", label: "Payouts", icon: Banknote },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardNav() {
  const { pathname } = useLocation();
  return (
    <div className="mb-8 -mx-2 flex gap-1 overflow-x-auto border-b border-border px-2">
      {items.map((it) => {
        const active = pathname === it.to;
        return (
          <Link key={it.to} to={it.to} className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${active ? "border-primary text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}>
            <it.icon className="h-4 w-4" /> {it.label}
          </Link>
        );
      })}
    </div>
  );
}
