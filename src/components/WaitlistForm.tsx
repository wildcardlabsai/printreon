import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  role_interest: z.enum(["creator", "supporter"]),
});

export function WaitlistForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"creator" | "supporter">("creator");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isDark = variant === "dark";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const parsed = schema.safeParse({ email, role_interest: role });
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setStatus("loading");
    const { error } = await supabase.from("waitlist").insert({
      email: parsed.data.email.toLowerCase(),
      role_interest: parsed.data.role_interest,
    });
    if (error) {
      if (error.code === "23505") {
        setStatus("success");
        setMessage("You're already on the list — we'll be in touch.");
        return;
      }
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      return;
    }
    setStatus("success");
    setMessage("You're on the list — we'll email you at launch.");
    setEmail("");
  }

  if (status === "success") {
    return (
      <div
        className={`flex items-start gap-3 rounded-2xl border p-5 ${
          isDark
            ? "border-background/20 bg-background/5 text-background"
            : "border-border bg-card text-ink"
        }`}
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold">Thanks for joining!</div>
          <p className={`mt-1 text-sm ${isDark ? "text-background/70" : "text-ink-soft"}`}>
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-lg space-y-3">
      <div
        className={`inline-flex rounded-full p-1 text-sm font-medium ${
          isDark ? "bg-background/10" : "bg-secondary"
        }`}
        role="tablist"
        aria-label="I am a"
      >
        {(["creator", "supporter"] as const).map((r) => {
          const active = role === r;
          return (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(r)}
              className={`rounded-full px-4 py-1.5 transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : isDark
                    ? "text-background/70 hover:text-background"
                    : "text-ink-soft hover:text-ink"
              }`}
            >
              I'm a {r}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`h-12 flex-1 rounded-xl border px-4 text-base outline-none transition focus:ring-2 focus:ring-primary/40 ${
            isDark
              ? "border-background/20 bg-background/10 text-background placeholder:text-background/50"
              : "border-border bg-card text-ink placeholder:text-ink-soft/60"
          }`}
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary h-12 px-6 text-base disabled:opacity-60"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join the waitlist"}
        </button>
      </div>
      {status === "error" && message && (
        <p className="text-sm text-destructive">{message}</p>
      )}
      <p className={`text-xs ${isDark ? "text-background/60" : "text-ink-soft"}`}>
        No spam. We'll only email you when Printreon opens.
      </p>
    </form>
  );
}
