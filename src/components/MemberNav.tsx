import { Link, useLocation } from "@tanstack/react-router";
import { Heart, Download, Compass, Settings, Sparkles, Bookmark, Bell, MessageSquare, Camera, Gift, Receipt, ScrollText, Library } from "lucide-react";

const items = [
  { to: "/me", label: "Overview", icon: Sparkles },
  { to: "/me/subscriptions", label: "Subscriptions", icon: Heart },
  { to: "/me/library", label: "Creator library", icon: Library },
  { to: "/me/downloads", label: "Downloads", icon: Download },
  { to: "/me/licences", label: "Licences", icon: ScrollText },
  { to: "/me/receipts", label: "Receipts", icon: Receipt },
  { to: "/me/wishlist", label: "Wishlist", icon: Bookmark },

  { to: "/me/messages", label: "Messages", icon: MessageSquare },
  { to: "/me/notifications", label: "Notifications", icon: Bell },
  { to: "/me/print-log", label: "Print log", icon: Camera },
  { to: "/me/gifts", label: "Gifts", icon: Gift },
  { to: "/me/following", label: "Following", icon: Compass },
  { to: "/me/settings", label: "Settings", icon: Settings },
] as const;

export function MemberNav() {
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
