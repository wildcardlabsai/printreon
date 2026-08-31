import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteChrome";

export const Route = createFileRoute("/join")({
  validateSearch: (s: Record<string, unknown>) => ({ invite: typeof s.invite === "string" ? s.invite : "" }),
  head: () => ({ meta: [{ title: "Join Printreon" }] }),
  component: Join,
});

function Join() {
  const { invite } = Route.useSearch();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [msg, setMsg] = useState("");

  useEffect(() => { (async () => {
    if (!invite) return setStatus("invalid");
    const { data, error } = await supabase.rpc("check_invite_code", { p_code: invite });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row?.valid) {
      setStatus("invalid");
      setMsg(row?.reason ?? "This invite link isn't valid.");
      return;
    }
    sessionStorage.setItem("printreon_invite", invite);
    setStatus("valid");
    setTimeout(() => navigate({ to: "/auth" }), 1500);
  })(); }, [invite, navigate]);

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-20 text-center">
        {status === "checking" && <p className="text-ink-soft">Checking invite…</p>}
        {status === "valid" && <>
          <h1 className="text-3xl font-bold text-ink">You're in.</h1>
          <p className="mt-2 text-ink-soft">Taking you to sign-up…</p>
        </>}
        {status === "invalid" && <>
          <h1 className="text-3xl font-bold text-ink">Invite unavailable</h1>
          <p className="mt-2 text-ink-soft">{msg || "This invite link isn't valid."}</p>
        </>}
      </div>
    </div>
  );
}
