import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  as: z.enum(["member", "creator"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — Printreon" }] }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const wantsCreator = search.as === "creator";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created!");
        navigate({ to: wantsCreator ? "/onboarding/creator" : "/me" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: search.redirect ?? "/me" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const target = search.redirect ?? (wantsCreator ? "/onboarding/creator" : "/me");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${target}`,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: target });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>

        <div className="card-soft">
          <h1 className="text-2xl font-bold text-ink">
            {mode === "signup" ? (wantsCreator ? "Become a Creator" : "Create your account") : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {mode === "signup" ? "Start in seconds. No credit card required." : "Sign in to access your dashboard."}
          </p>

          <button onClick={onGoogle} disabled={loading} className="btn-ghost mt-6 w-full gap-2">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.8 6.3 14.7z"/><path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-2.1 14-5.5l-6.5-5.5C29.6 34.4 26.9 35.5 24 35.5c-5.3 0-9.7-3.1-11.4-7.6l-6.5 5C9.5 39.1 16.2 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.5 5.5c-.5.4 7.2-5.2 7.2-14.8 0-1.2-.1-2.3-.4-3.5z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-soft">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-ink">Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-ink">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink">Password</label>
              <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          {mode === "signin" && (
            <div className="mt-4 text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-primary">Forgot password?</Link>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-ink-soft">
            {mode === "signup" ? (
              <>Already have an account? <button onClick={() => setMode("signin")} className="font-semibold text-primary">Sign in</button></>
            ) : (
              <>New to Printreon? <button onClick={() => setMode("signup")} className="font-semibold text-primary">Create account</button></>
            )}
          </p>
        </div>

        <DevQuickLogin />
      </div>

    </div>
  );
}

/**
 * Test-only panel: seeds/repairs the three demo accounts and signs straight in.
 * Hidden on the live domain, and the underlying server fn refuses to run there.
 */
function DevQuickLogin() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const seed = useServerFn(ensureDemoAccounts);

  useEffect(() => setVisible(devToolsEnabled()), []);
  if (!visible) return null;

  const login = async (account: (typeof DEMO_LOGINS)[number]) => {
    setBusy(account.email);
    try {
      await seed({});
      const { error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: "DemoPass123!",
      });
      if (error) throw error;
      toast.success(`Signed in as ${account.label}`);
      navigate({ to: account.to });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card-soft mt-6 border-dashed">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Testing shortcuts (preview only)
      </p>
      <div className="mt-3 grid gap-2">
        {DEMO_LOGINS.map((a) => (
          <button
            key={a.email}
            onClick={() => login(a)}
            disabled={busy !== null}
            className="btn-ghost w-full justify-between text-sm"
          >
            <span>{busy === a.email ? "Signing in…" : `Log in as ${a.label}`}</span>
            <span className="text-xs text-ink-soft">{a.email}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">Password for all demo accounts: DemoPass123!</p>
    </div>
  );
}

const DEMO_LOGINS = [
  { label: "Supporter", email: "buyer@demo.printreon.test", to: "/me" as const },
  { label: "Creator", email: "creator@demo.printreon.test", to: "/dashboard" as const },
  { label: "Admin", email: "admin@demo.printreon.test", to: "/admin" as const },
];
