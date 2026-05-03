import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Save, LogOut, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/me/settings")({
  component: MemberSettings,
});

function MemberSettings() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setFullName(data?.full_name ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const sendReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message); else toast.success("Reset link sent");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-ink">Profile</h2>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-ink">Email</span>
          <input value={user?.email ?? ""} disabled className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-ink-soft" />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-ink">Full name</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </label>
        <button onClick={save} disabled={busy} className="btn-primary mt-4"><Save className="mr-2 h-4 w-4" />Save</button>
      </div>
      <div className="card-soft">
        <h2 className="text-lg font-bold text-ink">Account</h2>
        <p className="mt-1 text-sm text-ink-soft">Manage password and sessions.</p>
        <div className="mt-4 grid gap-2">
          <button onClick={sendReset} className="btn-ghost justify-start"><KeyRound className="mr-2 h-4 w-4" />Send password reset email</button>
          <button onClick={() => signOut()} className="btn-ghost justify-start text-destructive hover:bg-destructive/10"><LogOut className="mr-2 h-4 w-4" />Sign out</button>
        </div>
      </div>
    </div>
  );
}
