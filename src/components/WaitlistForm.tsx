import { useEffect, useState } from "react";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const baseSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  role_interest: z.enum(["creator", "supporter"]),
  full_name: z.string().trim().max(120).optional().or(z.literal("")),
  creator_name: z.string().trim().max(120).optional().or(z.literal("")),
  
  current_platform: z.string().trim().max(120).optional().or(z.literal("")),
  audience_size: z.string().trim().max(40).optional().or(z.literal("")),
  sells_stls: z.boolean(),
  sells_physical_prints: z.boolean(),
  interested_in_commercial_licensing: z.boolean(),
  biggest_frustration: z.string().trim().max(1000).optional().or(z.literal("")),
  acknowledge: z.boolean().refine((v) => v, "Please acknowledge the beta is invite-only"),
});

const audienceOptions = ["<1k", "1k–10k", "10k–50k", "50k–100k", "100k+"] as const;

export function WaitlistForm({
  variant = "light",
  compact = false,
}: {
  variant?: "light" | "dark";
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [role, setRole] = useState<"creator" | "supporter">("creator");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  
  const [currentPlatform, setCurrentPlatform] = useState("");
  const [audienceSize, setAudienceSize] = useState("");
  const [sellsStls, setSellsStls] = useState(false);
  const [sellsPrints, setSellsPrints] = useState(false);
  const [commercial, setCommercial] = useState(false);
  const [frustration, setFrustration] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const isDark = variant === "dark";

  useEffect(() => {
    try {
      const code = sessionStorage.getItem("printreon_invite");
      if (code) setInviteCode(code);
      const ref = sessionStorage.getItem("printreon_ref");
      if (ref) setReferredBy(ref);
      // Pull ?ref= from URL
      const url = new URL(window.location.href);
      const refParam = url.searchParams.get("ref");
      if (refParam) {
        sessionStorage.setItem("printreon_ref", refParam);
        setReferredBy(refParam);
      }
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
      current_platform: currentPlatform,
      audience_size: audienceSize,
      sells_stls: sellsStls,
      sells_physical_prints: sellsPrints,
      interested_in_commercial_licensing: commercial,
      biggest_frustration: frustration,
      acknowledge,
    });
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setStatus("loading");

    const d = parsed.data;
    const isCreator = role === "creator";
    const payload = {
      email: d.email.toLowerCase(),
      full_name: d.full_name || null,
      creator_name: isCreator ? d.creator_name || null : null,
      
      current_platform: isCreator ? d.current_platform || null : null,
      audience_size: isCreator ? d.audience_size || null : null,
      sells_stls: isCreator ? d.sells_stls : false,
      sells_physical_prints: isCreator ? d.sells_physical_prints : false,
      interested_in_commercial_licensing: isCreator
        ? d.interested_in_commercial_licensing
        : false,
      biggest_frustration: d.biggest_frustration || null,
      reason_for_joining: d.biggest_frustration || null,
      source: "landing",
      tags: [role],
      invite_code: inviteCode,
      referred_by: referredBy,
    };

    const { data: rows, error } = await supabase.rpc(
      "submit_beta_preregistration",
      { payload },
    );
    const data = Array.isArray(rows) ? rows[0] : rows;

    if (error) {
      const dup = error.code === "23505" || /duplicate/i.test(error.message ?? "");
      if (dup) {
        // Already applied — still send to /waitlist with email lookup.
        try {
          localStorage.setItem(
            "printreon_application",
            JSON.stringify({ email: payload.email, returning: true }),
          );
        } catch {
          /* no-op */
        }
        navigate({ to: "/waitlist" });
        return;
      }
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      return;
    }

    try {
      localStorage.setItem(
        "printreon_application",
        JSON.stringify({
          email: data?.email ?? payload.email,
          referral_code: data?.referral_code ?? null,
          status: data?.status ?? (inviteCode ? "invited" : "pending"),
          founder_pricing_eligible: data?.founder_pricing_eligible ?? true,
        }),
      );
    } catch {
      /* no-op */
    }
    navigate({ to: "/waitlist" });
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
      {referredBy && !inviteCode && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            isDark
              ? "border-background/20 bg-background/10 text-background"
              : "border-border bg-card text-ink"
          }`}
        >
          Referred by <span className="font-mono font-semibold">{referredBy}</span> — counts toward
          their priority access.
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
              <label className={labelCls} htmlFor="pr-social">Website / social link</label>
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

            {!compact && (
              <div className="sm:col-span-2 space-y-1">
                <label className={labelCls} htmlFor="pr-frustration">
                  Biggest frustration with current platforms
                </label>
                <textarea
                  id="pr-frustration"
                  rows={3}
                  placeholder="What's broken about how you sell STLs today?"
                  value={frustration}
                  onChange={(e) => setFrustration(e.target.value)}
                  className={`${inputCls} h-auto py-3`}
                />
              </div>
            )}
          </>
        )}
      </div>

      <label
        className={`flex items-start gap-2 text-xs ${
          isDark ? "text-background/70" : "text-ink-soft"
        }`}
      >
        <input
          type="checkbox"
          checked={acknowledge}
          onChange={(e) => setAcknowledge(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
        />
        <span>I understand beta access is invite-only and limited.</span>
      </label>

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
          "Apply For Founder Access"
        )}
      </button>

      {status === "error" && message && (
        <p className="text-sm text-destructive">{message}</p>
      )}
      <p className={`text-xs ${isDark ? "text-background/60" : "text-ink-soft"}`}>
        Founding creators lock in higher payouts for life. No spam — we only email you about Printreon.
      </p>
    </form>
  );
}
