import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

const baseSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  role_interest: z.enum(["creator", "supporter"]),
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  creator_name: z.string().trim().max(120).optional().or(z.literal("")),
  social_url: z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal("")),
  current_platform: z.string().trim().max(120).optional().or(z.literal("")),
  audience_size: z.string().trim().max(40).optional().or(z.literal("")),
  sells_stls: z.boolean(),
  sells_physical_prints: z.boolean(),
  interested_in_commercial_licensing: z.boolean(),
  reason_for_joining: z.string().trim().max(1000).optional().or(z.literal("")),
});

const audienceOptions = ["<1k", "1k–10k", "10k–50k", "50k–100k", "100k+"] as const;

export function WaitlistForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [role, setRole] = useState<"creator" | "supporter">("creator");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [sellsStls, setSellsStls] = useState(false);
  const [sellsPrints, setSellsPrints] = useState(false);
  const [commercial, setCommercial] = useState(false);
  const [reason, setReason] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isDark = variant === "dark";

  useEffect(() => {
    try {
      const code = sessionStorage.getItem("printreon_invite");
      if (code) setInviteCode(code);
    } catch {
      /* no-op */
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const parsed = baseSchema.safeParse({
      email,
      role_interest: role,
      full_name: fullName,
      creator_name: creatorName,
      social_url: socialUrl,
      current_platform: currentPlatform,
      audience_size: audienceSize,
      sells_stls: sellsStls,
      sells_physical_prints: sellsPrints,
      interested_in_commercial_licensing: commercial,
      reason_for_joining: reason,
    });
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setStatus("loading");

    const d = parsed.data;
    const hasInvite = !!inviteCode;
    const row = {
      email: d.email.toLowerCase(),
      full_name: d.full_name || null,
      creator_name: role === "creator" ? d.creator_name || null : null,
      social_url: role === "creator" ? d.social_url || null : null,
      current_platform: role === "creator" ? d.current_platform || null : null,
      audience_size: role === "creator" ? d.audience_size || null : null,
      sells_stls: role === "creator" ? d.sells_stls : false,
      sells_physical_prints: role === "creator" ? d.sells_physical_prints : false,
      interested_in_commercial_licensing:
        role === "creator" ? d.interested_in_commercial_licensing : false,
      reason_for_joining: d.reason_for_joining || null,
      source: "landing",
      tags: [role],
      invite_code: inviteCode,
      status: hasInvite ? "invited" : "pending",
      invited_at: hasInvite ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("beta_preregistrations").insert(row);
    if (error) {
      setStatus("error");
      setMessage(
        error.code === "23505"
          ? "You're already on the list — we'll be in touch."
          : "Something went wrong. Please try again.",
      );
      if (error.code === "23505") setStatus("success");
      return;
    }
    setStatus("success");
    setMessage(
      hasInvite
        ? "Invite received — we'll email you next steps shortly."
        : "You're on the list — we'll email you at launch.",
    );
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

  const inputCls = `h-11 w-full rounded-xl border px-4 text-base outline-none transition focus:ring-2 focus:ring-primary/40 ${
    isDark
      ? "border-background/20 bg-background/10 text-background placeholder:text-background/50"
      : "border-border bg-card text-ink placeholder:text-ink-soft/60"
  }`;
  const labelCls = `text-xs font-medium uppercase tracking-wide ${isDark ? "text-background/70" : "text-ink-soft"}`;

  return (
    <form onSubmit={onSubmit} className="w-full max-w-lg space-y-4">
      {inviteCode && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            isDark
              ? "border-background/20 bg-background/10 text-background"
              : "border-primary/30 bg-primary/5 text-ink"
          }`}
        >
          Invite code <span className="font-mono font-semibold">{inviteCode}</span> applied.
        </div>
      )}

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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className={labelCls} htmlFor="pr-email">Email</label>
          <input
            id="pr-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className={labelCls} htmlFor="pr-name">Full name</label>
          <input
            id="pr-name"
            type="text"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
          />
        </div>

        {role === "creator" && (
          <>
            <div className="space-y-1">
              <label className={labelCls} htmlFor="pr-creator">Creator / brand name</label>
              <input
                id="pr-creator"
                type="text"
                placeholder="e.g. ForgeWorks"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className={labelCls} htmlFor="pr-social">Main social / store URL</label>
              <input
                id="pr-social"
                type="url"
                placeholder="https://instagram.com/yourhandle"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls} htmlFor="pr-platform">Currently selling on</label>
              <input
                id="pr-platform"
                type="text"
                placeholder="Patreon, Cults, MakerWorld…"
                value={currentPlatform}
                onChange={(e) => setCurrentPlatform(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls} htmlFor="pr-audience">Audience size</label>
              <select
                id="pr-audience"
                value={audienceSize}
                onChange={(e) => setAudienceSize(e.target.value)}
                className={inputCls}
              >
                <option value="">Select…</option>
                {audienceOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 grid gap-2 pt-1">
              {[
                { v: sellsStls, set: setSellsStls, label: "I sell STL files" },
                { v: sellsPrints, set: setSellsPrints, label: "I sell physical prints" },
                { v: commercial, set: setCommercial, label: "Interested in commercial licensing" },
              ].map((opt) => (
                <label key={opt.label} className={`flex items-center gap-2 text-sm ${isDark ? "text-background/80" : "text-ink"}`}>
                  <input
                    type="checkbox"
                    checked={opt.v}
                    onChange={(e) => opt.set(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className={labelCls} htmlFor="pr-reason">Why do you want in?</label>
              <textarea
                id="pr-reason"
                rows={3}
                placeholder="Tell us a bit about what you'd use Printreon for."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`${inputCls} h-auto py-3`}
              />
            </div>
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary h-12 w-full px-6 text-base disabled:opacity-60"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : inviteCode ? (
          "Claim my invite"
        ) : (
          "Request beta access"
        )}
      </button>

      {status === "error" && message && (
        <p className="text-sm text-destructive">{message}</p>
      )}
      <p className={`text-xs ${isDark ? "text-background/60" : "text-ink-soft"}`}>
        No spam. We'll only email you about Printreon.
      </p>
    </form>
  );
}
