import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { useServerFn } from "@tanstack/react-start";
import { notifyOnPublish } from "@/functions/notify.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/posts")({
  head: () => ({ meta: [{ title: "Posts — Creator Studio" }] }),
  component: PostsPage,
});

function PostsPage() {
  const { creator } = useCreatorProfile();
  const [posts, setPosts] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", body: "", audience: "everyone" });
  const notify = useServerFn(notifyOnPublish);

  const load = async () => {
    if (!creator) return;
    const { data } = await supabase.from("creator_posts").select("*").eq("creator_id", creator.id).order("created_at", { ascending: false });
    setPosts(data ?? []);
  };
  useEffect(() => { load(); }, [creator]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;
    const { data: inserted, error } = await supabase
      .from("creator_posts")
      .insert({ creator_id: creator.id, ...form, status: "published", published_at: new Date().toISOString() })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    setForm({ title: "", body: "", audience: "everyone" });
    if (inserted?.id) {
      try {
        const r = await notify({ data: { kind: "post", itemId: inserted.id } });
        if (r.notified > 0) toast.success(`Published — notified ${r.notified} ${r.notified === 1 ? "person" : "people"}`);
        else toast.success("Published");
      } catch { toast.success("Published"); }
    }
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("creator_posts").delete().eq("id", id);
    load();
  };

  if (!creator) return null;
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Long-form posts</h2>
      <p className="text-sm text-ink-soft">Patreon-style updates with images and tier targeting.</p>
      <form onSubmit={submit} className="card-soft mt-4 space-y-3">
        <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" />
        <textarea required rows={6} placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" />
        <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="w-full rounded-md border border-border bg-background p-2">
          <option value="everyone">Everyone</option>
          <option value="followers">Followers</option>
          <option value="subscribers">Subscribers</option>
        </select>
        <button className="btn-primary">Publish</button>
      </form>
      <div className="mt-6 space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="card-soft flex items-start justify-between">
            <div><p className="font-semibold text-ink">{p.title}</p><p className="text-xs text-ink-soft">{p.audience} · {new Date(p.created_at).toLocaleDateString()}</p></div>
            <button onClick={() => remove(p.id)} className="text-sm text-destructive hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
