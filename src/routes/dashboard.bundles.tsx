import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/bundles")({
  head: () => ({ meta: [{ title: "Bundles — Creator Studio" }] }),
  component: BundlesPage,
});

function BundlesPage() {
  const { creator } = useCreatorProfile();
  const [bundles, setBundles] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", slug: "", description: "" });

  const load = async () => {
    if (!creator) return;
    const { data } = await supabase.from("bundles").select("*").eq("creator_id", creator.id).order("created_at", { ascending: false });
    setBundles(data ?? []);
  };
  useEffect(() => { load(); }, [creator]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("bundles").insert({ creator_id: creator.id, ...form, slug, is_published: true });
    if (error) return toast.error(error.message);
    setForm({ title: "", slug: "", description: "" });
    load();
  };

  if (!creator) return null;
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Bundles</h2>
      <p className="text-sm text-ink-soft">Group multiple STLs into themed packs.</p>
      <form onSubmit={submit} className="card-soft mt-4 space-y-3">
        <input required placeholder="Bundle title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" />
        <input placeholder="slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" />
        <button className="btn-primary">Create bundle</button>
      </form>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {bundles.map((b) => (
          <div key={b.id} className="card-soft">
            <p className="font-semibold text-ink">{b.title}</p>
            <p className="text-xs text-ink-soft">/{b.slug}</p>
            <p className="mt-2 text-sm text-ink-soft">{b.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
