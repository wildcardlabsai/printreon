import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Layers, Upload, User as UserIcon, Sparkles, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/creator")({
  head: () => ({ meta: [{ title: "Creator onboarding — MakerMind Club" }] }),
  component: CreatorOnboarding,
});

const STEPS = [
  { n: 1, label: "Identity", icon: UserIcon },
  { n: 2, label: "Brand", icon: Sparkles },
  { n: 3, label: "First tier", icon: Layers },
  { n: 4, label: "First file", icon: Upload },
  { n: 5, label: "Publish", icon: CheckCircle2 },
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function CreatorOnboarding() {
  const { user, loading, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [creatorId, setCreatorId] = useState<string | null>(null);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortIntro, setShortIntro] = useState("");

  // Step 2
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");

  // Step 3
  const [tierName, setTierName] = useState("Standard Files");
  const [tierPrice, setTierPrice] = useState("5");
  const [tierBenefits, setTierBenefits] = useState("Access to all standard STL drops\nMonthly new files\nDiscord-style community access");

  // Step 4
  const [fileTitle, setFileTitle] = useState("");
  const [fileDesc, setFileDesc] = useState("");
  const [fileCategory, setFileCategory] = useState("Miniatures");
  const [fileIsFree, setFileIsFree] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "signup", as: "creator" } });
  }, [user, loading, navigate]);

  // Load existing creator profile if any
  useEffect(() => {
    if (!user) return;
    supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setCreatorId(data.id);
        setDisplayName(data.display_name);
        setSlug(data.slug);
        setShortIntro(data.short_intro ?? "");
        setBio(data.bio ?? "");
        setWebsite(data.website_url ?? "");
        setInstagram(data.instagram_url ?? "");
        setYoutube(data.youtube_url ?? "");
      }
    });
  }, [user]);

  const ensureCreatorRole = async () => {
    if (!user) return;
    await supabase.from("user_roles").upsert({ user_id: user.id, role: "creator" }, { onConflict: "user_id,role" });
    await refreshRoles();
  };

  const saveStep1 = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const finalSlug = slug || slugify(displayName);
      await ensureCreatorRole();
      const payload = {
        user_id: user.id,
        display_name: displayName,
        slug: finalSlug,
        short_intro: shortIntro,
      };
      if (creatorId) {
        const { error } = await supabase.from("creator_profiles").update(payload).eq("id", creatorId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("creator_profiles").insert(payload).select("id").single();
        if (error) throw error;
        setCreatorId(data.id);
      }
      setStep(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally { setBusy(false); }
  };

  const saveStep2 = async () => {
    if (!creatorId) return;
    setBusy(true);
    const { error } = await supabase.from("creator_profiles").update({
      bio, website_url: website || null, instagram_url: instagram || null, youtube_url: youtube || null,
    }).eq("id", creatorId);
    setBusy(false);
    if (error) return toast.error(error.message);
    setStep(3);
  };

  const saveStep3 = async () => {
    if (!creatorId) return;
    setBusy(true);
    const { error } = await supabase.from("creator_tiers").insert({
      creator_id: creatorId,
      name: tierName,
      price: Number(tierPrice),
      currency: "USD",
      benefits: tierBenefits.split("\n").filter(Boolean),
      sort_order: 0,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setStep(4);
  };

  const saveStep4 = async () => {
    if (!creatorId) return;
    setBusy(true);
    const fileSlug = slugify(fileTitle);
    const { error } = await supabase.from("creator_files").insert({
      creator_id: creatorId,
      title: fileTitle,
      slug: fileSlug,
      description: fileDesc,
      category: fileCategory,
      is_free: fileIsFree,
      is_published: false,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setStep(5);
  };

  const publish = async () => {
    if (!creatorId) return;
    setBusy(true);
    const { error } = await supabase.from("creator_profiles").update({ is_published: true }).eq("id", creatorId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Your creator page is live!");
    navigate({ to: "/dashboard" });
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-surface" />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-ink md:text-4xl">Set up your Creator Club</h1>
          <p className="mt-2 text-ink-soft">5 quick steps. You can refine everything later.</p>

          {/* Stepper */}
          <ol className="mt-8 grid grid-cols-5 gap-2">
            {STEPS.map((s) => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <li key={s.n} className={`rounded-xl border p-3 text-center text-xs font-semibold ${active ? "border-primary bg-accent text-primary" : done ? "border-primary/40 bg-card text-primary" : "border-border bg-card text-ink-soft"}`}>
                  <s.icon className="mx-auto h-4 w-4" />
                  <div className="mt-1">{s.label}</div>
                </li>
              );
            })}
          </ol>

          <div className="card-soft mt-8">
            {step === 1 && (
              <>
                <h2 className="text-xl font-bold text-ink">Your creator identity</h2>
                <p className="mt-1 text-sm text-ink-soft">This is how supporters will find you.</p>
                <div className="mt-5 space-y-3">
                  <Field label="Display name"><input value={displayName} onChange={(e) => { setDisplayName(e.target.value); if (!creatorId) setSlug(slugify(e.target.value)); }} className={input} /></Field>
                  <Field label="URL slug"><div className="flex items-stretch overflow-hidden rounded-lg border border-input"><span className="bg-secondary px-3 py-2 text-sm text-ink-soft">makermind.club/c/</span><input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="flex-1 bg-background px-3 py-2 text-sm outline-none" /></div></Field>
                  <Field label="Short intro (one line)"><input value={shortIntro} onChange={(e) => setShortIntro(e.target.value)} maxLength={120} className={input} /></Field>
                </div>
                <Footer onNext={saveStep1} disabled={!displayName || busy} />
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-xl font-bold text-ink">Brand your page</h2>
                <p className="mt-1 text-sm text-ink-soft">Tell supporters what you make.</p>
                <div className="mt-5 space-y-3">
                  <Field label="Bio"><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={input} /></Field>
                  <Field label="Website"><input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className={input} /></Field>
                  <Field label="Instagram"><input value={instagram} onChange={(e) => setInstagram(e.target.value)} className={input} /></Field>
                  <Field label="YouTube"><input value={youtube} onChange={(e) => setYoutube(e.target.value)} className={input} /></Field>
                </div>
                <Footer onBack={() => setStep(1)} onNext={saveStep2} disabled={busy} />
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="text-xl font-bold text-ink">Create your first tier</h2>
                <p className="mt-1 text-sm text-ink-soft">You can add more tiers later.</p>
                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {["Supporter", "Standard Files", "Premium Vault", "Commercial Licence"].map((t) => (
                    <button key={t} type="button" onClick={() => setTierName(t)} className={`rounded-lg border p-2 text-xs font-semibold ${tierName === t ? "border-primary bg-accent text-primary" : "border-border bg-card text-ink-soft"}`}>{t}</button>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Field label="Tier name"><input value={tierName} onChange={(e) => setTierName(e.target.value)} className={input} /></Field>
                  <Field label="Monthly price (USD)"><input type="number" min="1" step="1" value={tierPrice} onChange={(e) => setTierPrice(e.target.value)} className={input} /></Field>
                </div>
                <Field label="Benefits (one per line)"><textarea value={tierBenefits} onChange={(e) => setTierBenefits(e.target.value)} rows={4} className={input} /></Field>
                <Footer onBack={() => setStep(2)} onNext={saveStep3} disabled={!tierName || busy} />
              </>
            )}
            {step === 4 && (
              <>
                <h2 className="text-xl font-bold text-ink">Add your first file</h2>
                <p className="mt-1 text-sm text-ink-soft">You can upload the actual STL/3MF in your dashboard.</p>
                <div className="mt-5 space-y-3">
                  <Field label="Title"><input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} className={input} /></Field>
                  <Field label="Description"><textarea value={fileDesc} onChange={(e) => setFileDesc(e.target.value)} rows={3} className={input} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                      <select value={fileCategory} onChange={(e) => setFileCategory(e.target.value)} className={input}>
                        {["Miniatures", "Cosplay", "Functional", "Toys", "Home decor", "Tools", "Art", "Tabletop gaming", "Seasonal"].map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Access">
                      <select value={fileIsFree ? "free" : "locked"} onChange={(e) => setFileIsFree(e.target.value === "free")} className={input}>
                        <option value="free">Free with account (lead magnet)</option>
                        <option value="locked">Locked behind tier</option>
                      </select>
                    </Field>
                  </div>
                </div>
                <Footer onBack={() => setStep(3)} onNext={saveStep4} disabled={!fileTitle || busy} nextLabel="Continue" />
              </>
            )}
            {step === 5 && (
              <>
                <h2 className="text-xl font-bold text-ink">Publish your creator page</h2>
                <p className="mt-2 text-ink-soft">Your page will be live at:</p>
                <div className="mt-2 rounded-lg border border-border bg-secondary px-4 py-3 font-mono text-sm">makermind.club/c/{slug}</div>
                <div className="mt-6 flex items-center gap-3">
                  <button onClick={() => setStep(4)} className="btn-ghost">Back</button>
                  <button onClick={publish} disabled={busy} className="btn-primary">
                    Publish creator page <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Footer({ onBack, onNext, disabled, nextLabel = "Continue" }: { onBack?: () => void; onNext: () => void; disabled?: boolean; nextLabel?: string }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      {onBack ? <button onClick={onBack} className="btn-ghost">Back</button> : <span />}
      <button onClick={onNext} disabled={disabled} className="btn-primary">{nextLabel} <ArrowRight className="ml-2 h-4 w-4" /></button>
    </div>
  );
}
