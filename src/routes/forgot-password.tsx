import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — MakerMind Club" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="card-soft">
          <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
          {sent ? (
            <>
              <p className="mt-3 text-sm text-ink-soft">If an account exists for {email}, you'll receive a reset link shortly.</p>
              <button onClick={() => navigate({ to: "/auth" })} className="btn-ghost mt-5 w-full">Back to sign in</button>
            </>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-3">
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button className="btn-primary w-full">Send reset link</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
