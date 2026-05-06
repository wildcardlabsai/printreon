import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { MemberNav } from "@/components/MemberNav";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/me")({
  head: () => ({ meta: [{ title: "Your account — Printreon" }] }),
  component: MemberLayout,
});

function MemberLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface">
        <SiteHeader />
        <div className="container-page py-20 text-center text-ink-soft">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Your account · buying
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">{user.email}</h1>
          <RoleSwitcher active="buying" />
        </div>
        <MemberNav />
        <Outlet />
      </div>
    </div>
  );
}
