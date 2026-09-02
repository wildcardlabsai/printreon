import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDiscoveryEnabled } from "@/lib/use-discovery";
import { Sparkles, Mail, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore creators — Printreon" },
      { name: "description", content: "Browse 3D printing creators and subscribe to support their STL drops." },
    ],
  }),
  component: Explore,
});

interface Creator {
  id: string; slug: string; display_name: string; short_intro: string | null;
  profile_image_url: string | null; banner_image_url: string | null;
}

function Explore() {
  const discoveryEnabled = useDiscoveryEnabled();
  const [allCreators, setAllCreators] = useState<Creator[] | null>(null);
  const [featured, setFeatured] = useState<any[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.from("creator_profiles")
      .select("id, slug, display_name, short_intro, profile_image_url, banner_image_url")
      .eq("is_published", true)
      .is("suspended_at", null)
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => setAllCreators(data ?? []));

    supabase.from("creator_files")
      .select("creator_id")
      .eq("is_published", true)
      .is("takedown_at", null)
      .limit(5000)
      .then(({ data }) => {
        const m: Record<string, number> = {};
        (data ?? []).forEach((f: any) => { m[f.creator_id] = (m[f.creator_id] ?? 0) + 1; });
        setFileCounts(m);
      });

    supabase.from("featured_creators")
      .select("sort_order, creator_profiles(id, slug, display_name, short_intro, profile_image_url, banner_image_url, is_published, suspended_at)")
      .order("sort_order")
      .limit(6)
      .then(({ data }) => setFeatured(
        (data ?? [])
          .map((r: any) => r.creator_profiles)
          .filter((c: any) => c && c.is_published && !c.suspended_at)
      ));
  }, []);

  const fileLabel = (id: string) => {
    const n = fileCounts[id] ?? 0;
    return `${n} ${n === 1 ? "file" : "files"}`;
  };


  // If no creators have been hand-featured yet, spotlight the newest ones so
  // the discovery section is never empty.
  const spotlight = featured.length > 0 ? featured : (allCreators ?? []).slice(0, 3);

  const q = query.trim().toLowerCase();
  const creators =
    allCreators === null
      ? null
      : q
        ? allCreators.filter(
            (c) =>
              c.display_name.toLowerCase().includes(q) ||
              c.slug.toLowerCase().includes(q) ||
              (c.short_intro ?? "").toLowerCase().includes(q)
          )
        : allCreators;

  const joinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("waitlist").insert({ email, role_interest: "member" });
    if (error) toast.error(error.message);
    else { toast.success("You're on the list."); setEmail(""); }
  };

  const comingSoonPanel = (
    <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-2xl font-bold text-ink">Printreon is opening for creators soon.</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        We're onboarding the first wave of 3D printing designers. Join the waitlist to be notified when new creators go live.
      </p>
      <form onSubmit={joinWaitlist} className="mx-auto mt-6 flex max-w-md gap-2">
        <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        <button className="btn-primary"><Mail className="mr-2 h-4 w-4" />Join waitlist</button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        Are you a creator? <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="font-semibold text-primary">Start your page →</Link>
      </p>
    </div>
  );

  if (!discoveryEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <section className="container-page py-14">
          <h1 className="text-4xl font-bold text-ink md:text-5xl">Creators coming soon</h1>
          <p className="mt-3 max-w-xl text-ink-soft">We're onboarding the first wave of 3D printing designers. Join the waitlist and we'll tell you the moment new creators go live.</p>
          {comingSoonPanel}
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container-page py-14">
        <h1 className="text-4xl font-bold text-ink md:text-5xl">Explore creators</h1>
        <p className="mt-3 max-w-xl text-ink-soft">Discover 3D printing designers selling STL, 3MF and printable files through monthly memberships.</p>


        <div className="mt-6 max-w-md">
          <label htmlFor="creator-search" className="sr-only">Search creators</label>
          <input
            id="creator-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search creators, niches, keywords…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        {spotlight.length > 0 && !q && (
          <div className="mt-10">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-ink">{featured.length > 0 ? "Featured creators" : "Creators to discover"}</h2>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Hand-picked designers worth a follow.</p>
            <div className="mt-4 grid gap-5 md:grid-cols-3">
              {spotlight.map((c: any) => (
                <Link
                  key={c.id}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="group relative overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
                >
                  {featured.length > 0 && <span className="absolute right-3 top-3 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Featured</span>}
                  <div className="aspect-[3/1] bg-gradient-to-br from-accent to-secondary" style={c.banner_image_url ? { backgroundImage: `url(${c.banner_image_url})`, backgroundSize: "cover" } : undefined} />
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      {c.profile_image_url ? (
                        <img src={c.profile_image_url} alt={`${c.display_name} profile photo`} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent font-bold text-primary">{c.display_name[0]}</div>
                      )}
                      <div>
                        <h3 className="font-semibold text-ink group-hover:text-primary">{c.display_name}</h3>
                        <p className="text-xs text-ink-soft">@{c.slug}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-ink-soft">{fileLabel(c.id)}</p>
                    {c.short_intro && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{c.short_intro}</p>}
                  </div>
                </Link>
              ))}
            </div>
            <h2 className="mt-12 text-xl font-bold text-ink">All creators</h2>
          </div>
        )}

        {creators === null ? (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-soft animate-pulse h-56" />
            ))}
          </div>
        ) : creators.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
            <Sparkles className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-2xl font-bold text-ink">Printreon is opening for creators soon.</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-soft">
              We're onboarding the first wave of 3D printing designers. Join the waitlist to be notified when new creators go live.
            </p>
            <form onSubmit={joinWaitlist} className="mx-auto mt-6 flex max-w-md gap-2">
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button className="btn-primary"><Mail className="mr-2 h-4 w-4" />Join waitlist</button>
            </form>
            <p className="mt-6 text-sm text-ink-soft">
              Are you a creator? <Link to="/auth" search={{ mode: "signup", as: "creator" }} className="font-semibold text-primary">Start your page →</Link>
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {creators.map((c) => (
              <Link key={c.id} to="/c/$slug" params={{ slug: c.slug }} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
                <div className="aspect-[3/1] bg-gradient-to-br from-accent to-secondary" style={c.banner_image_url ? { backgroundImage: `url(${c.banner_image_url})`, backgroundSize: "cover" } : undefined} />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {c.profile_image_url ? (
                      <img src={c.profile_image_url} alt={`${c.display_name} profile photo`} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center font-bold">{c.display_name[0]}</div>
                    )}
                    <div>
                      <h3 className="font-semibold text-ink group-hover:text-primary">{c.display_name}</h3>
                      <p className="text-xs text-ink-soft">@{c.slug}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-ink-soft">{fileLabel(c.id)}</p>
                  {c.short_intro && <p className="mt-2 text-sm text-ink-soft line-clamp-2">{c.short_intro}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
