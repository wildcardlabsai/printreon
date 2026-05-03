import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Compass, Heart, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/me")({
  head: () => ({ meta: [{ title: "Your dashboard — MakerMind Club" }] }),
  component: MemberDashboard,
});

function MemberDashboard() {
  const { user, loading, isCreator } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<any[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("*, creator_profiles(display_name, slug, profile_image_url)").eq("user_id", user.id).then(({ data }) => setSubs(data ?? []));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink">Welcome back</h1>
            <p className="mt-1 text-ink-soft">{user.email}</p>
          </div>
          {!isCreator && (
            <Link to="/onboarding/creator" className="btn-primary">
              <Sparkles className="mr-2 h-4 w-4" /> Become a creator
            </Link>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-ink">Your subscriptions</h2>
          {subs === null ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card-soft animate-pulse h-32" />)}
            </div>
          ) : subs.length === 0 ? (
            <div className="card-soft mt-4 text-center">
              <Heart className="mx-auto h-10 w-10 text-primary" />
              <h3 className="mt-3 text-xl font-bold text-ink">Find creators worth supporting.</h3>
              <p className="mt-1 text-ink-soft">Browse the directory and back the designers you love.</p>
              <Link to="/explore" className="btn-primary mt-5 inline-flex">
                <Compass className="mr-2 h-4 w-4" /> Explore creators
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {subs.map((s) => (
                <Link key={s.id} to="/c/$slug" params={{ slug: s.creator_profiles.slug }} className="card-soft block">
                  <div className="flex items-center gap-3">
                    {s.creator_profiles.profile_image_url ? (
                      <img src={s.creator_profiles.profile_image_url} className="h-12 w-12 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center font-bold">{s.creator_profiles.display_name[0]}</div>
                    )}
                    <div>
                      <div className="font-semibold text-ink">{s.creator_profiles.display_name}</div>
                      <div className="text-xs text-ink-soft capitalize">{s.status}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm font-semibold text-primary">View page <ArrowRight className="ml-1 h-4 w-4" /></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
