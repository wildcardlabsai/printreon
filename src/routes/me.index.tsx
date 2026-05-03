import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Compass, Download, Heart, Sparkles } from "lucide-react";

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
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Link to="/explore" className="card-soft block hover:border-primary">
          <Compass className="h-6 w-6 text-primary" />
          <h3 className="mt-3 text-lg font-bold text-ink">Discover creators</h3>
          <p className="mt-1 text-sm text-ink-soft">Find designers building exactly what you want to print.</p>
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
