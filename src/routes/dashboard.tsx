import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { DashboardNav } from "@/components/DashboardNav";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { useEffect } from "react";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Creator dashboard — Printreon" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user, loading } = useAuth();
  const { creator, ready } = useCreatorProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (ready && user && !creator) navigate({ to: "/onboarding/creator" });
  }, [ready, creator, user, navigate]);

  if (!user || !creator) {
    return (
      <div className="min-h-screen bg-surface">
        <SiteHeader />
        <div className="container-page py-20 text-center text-ink-soft">Loading your studio…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Creator studio · selling
            </p>
            <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">{creator.display_name}</h1>
            <RoleSwitcher active="selling" />
          </div>
          <Link
            to="/c/$slug"
            params={{ slug: creator.slug }}
            className="btn-ghost h-9 px-3 py-2 text-sm"
            target="_blank"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> View public page
          </Link>
        </div>
        <DashboardNav />
        <Outlet />
      </div>
    </div>
  );
}
