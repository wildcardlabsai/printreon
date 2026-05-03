import { Link } from "@tanstack/react-router";
import { ShoppingBag, Palette, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Props {
  active: "buying" | "selling";
}

export function RoleSwitcher({ active }: Props) {
  const { isCreator } = useAuth();
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors";
  const on = "bg-ink text-background shadow-sm";
  const off = "text-ink-soft hover:text-ink";

  return (
    <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <Link
        to="/me"
        className={`${base} ${active === "buying" ? on : off}`}
        title="Switch to your buyer account"
      >
        <ShoppingBag className="h-4 w-4" /> Buying
      </Link>
      {isCreator ? (
        <Link
          to="/dashboard"
          className={`${base} ${active === "selling" ? on : off}`}
          title="Switch to your creator studio"
        >
          <Palette className="h-4 w-4" /> Selling
        </Link>
      ) : (
        <Link
          to="/onboarding/creator"
          className={`${base} ${off}`}
          title="Open a creator studio"
        >
          <Plus className="h-4 w-4" /> Become a creator
        </Link>
      )}
    </div>
  );
}
