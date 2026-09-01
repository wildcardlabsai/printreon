import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDiscoveryEnabled } from "@/lib/use-discovery";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Compass, Download, Heart, Sparkles, Palette, ArrowRight, Library } from "lucide-react";

export const Route = createFileRoute("/me/")({
  component: MemberOverview,
});

function MemberOverview() {
  const { user, isCreator } = useAuth();
  const [stats, setStats] = useState({ subs: 0, downloads: 0, following: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: subs }, { count: dls }, { count: fol }] = await Promise.all([
        supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
        supabase.from("downloads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setStats({ subs: subs ?? 0, downloads: dls ?? 0, following: fol ?? 0 });
    })();
  }, [user]);

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Active subscriptions" value={stats.subs} icon={Heart} />
        <Stat label="Files downloaded" value={stats.downloads} icon={Download} />
        <Stat label="Creators followed" value={stats.following} icon={Compass} />
      </div>
      {isCreator && (
        <Link
          to="/dashboard"
          className="card-soft mt-6 flex items-center justify-between gap-4 border-primary/40 bg-primary/5 hover:border-primary"
        >
          <div className="flex items-start gap-3">
            <Palette className="mt-0.5 h-6 w-6 text-primary" />
            <div>
              <h3 className="text-base font-bold text-ink">You also have a creator studio</h3>
              <p className="mt-1 text-sm text-ink-soft">
                Switch to your seller view to manage tiers, files, subscribers and payouts.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center text-sm font-semibold text-primary">
            Open studio <ArrowRight className="ml-1 h-4 w-4" />
          </span>
        </Link>
      )}
      <Link
        to="/me/library"
        className="card-soft mt-6 flex items-center justify-between gap-4 hover:border-primary"
      >
        <div className="flex items-start gap-3">
          <Library className="mt-0.5 h-6 w-6 text-primary" />
          <div>
            <h3 className="text-base font-bold text-ink">Your creator library</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Every file from the creators you support — preview in 3D and download in one place.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center text-sm font-semibold text-primary">
          Browse files <ArrowRight className="ml-1 h-4 w-4" />
        </span>
      </Link>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link to="/explore" className="card-soft block hover:border-primary">
          <Compass className="h-6 w-6 text-primary" />
          <h3 className="mt-3 text-lg font-bold text-ink">{discoveryEnabled ? "Discover creators" : "Creators coming soon"}</h3>
          <p className="mt-1 text-sm text-ink-soft">
            {discoveryEnabled
              ? "Find designers building exactly what you want to print."
              : "We're onboarding the first wave of designers — join the waitlist to hear first."}
          </p>
        </Link>
        {!isCreator && (
          <Link to="/onboarding/creator" className="card-soft block hover:border-primary">
            <Sparkles className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-lg font-bold text-ink">Become a creator</h3>
            <p className="mt-1 text-sm text-ink-soft">Sell your STLs with subscriptions in minutes.</p>
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="card-soft">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-xs font-semibold uppercase text-ink-soft">{label}</div>
      <div className="mt-1 text-3xl font-bold text-ink">{value}</div>
    </div>
  );
}
