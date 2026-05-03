import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Save, LogOut, KeyRound, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/me/settings")({
  component: MemberSettings,
});

function MemberSettings() {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  // 2FA state
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  const loadFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setFullName(data?.full_name ?? "");
    });
    loadFactors();
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

  const startEnroll = async () => {
    setMfaBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setMfaBusy(false);
    if (error || !data) return toast.error(error?.message ?? "Could not start 2FA");
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const verifyEnroll = async () => {
    if (!enrolling) return;
    setMfaBusy(true);
    const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({ factorId: enrolling.id });
    if (chalErr || !chal) { setMfaBusy(false); return toast.error(chalErr?.message ?? "Failed"); }
    const { error } = await supabase.auth.mfa.verify({ factorId: enrolling.id, challengeId: chal.id, code });
    setMfaBusy(false);
    if (error) return toast.error(error.message);
    toast.success("2FA enabled");
    setEnrolling(null);
    setCode("");
    loadFactors();
  };

  const removeFactor = async (id: string) => {
    if (!confirm("Disable 2FA?")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) return toast.error(error.message);
    toast.success("2FA disabled");
    loadFactors();
  };

  const verifiedFactor = factors.find((f) => f.status === "verified");

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

      <div className="card-soft lg:col-span-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-ink">Two-factor authentication</h2>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Protect your account with an authenticator app (Google Authenticator, 1Password, Authy).</p>

        {verifiedFactor ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary p-3">
            <div className="flex items-center gap-2 text-sm text-ink"><ShieldCheck className="h-4 w-4 text-primary" /> 2FA is enabled</div>
            <button onClick={() => removeFactor(verifiedFactor.id)} className="btn-ghost h-9 text-destructive"><ShieldOff className="mr-2 h-4 w-4" />Disable</button>
          </div>
        ) : enrolling ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs text-ink-soft">Scan this QR code with your authenticator app:</p>
              <div className="mt-2 inline-block rounded-lg border border-border bg-white p-3" dangerouslySetInnerHTML={{ __html: enrolling.qr }} />
              <p className="mt-2 break-all text-xs text-ink-soft">Or enter manually: <code className="font-mono">{enrolling.secret}</code></p>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">6-digit code from app</label>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-lg" />
              <div className="mt-3 flex gap-2">
                <button onClick={verifyEnroll} disabled={code.length !== 6 || mfaBusy} className="btn-primary">{mfaBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Verify & enable</button>
                <button onClick={() => { setEnrolling(null); setCode(""); }} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={startEnroll} disabled={mfaBusy} className="btn-primary mt-4">
            {mfaBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Enable 2FA
          </button>
        )}
      </div>
    </div>
  );
}
