import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { Megaphone, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/announcements")({
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { creator } = useCreatorProfile();
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<"everyone" | "followers" | "subscribers">("subscribers");

  const refresh = async () => {
    if (!creator) return;
    const { data } = await supabase.from("creator_announcements").select("*").eq("creator_id", creator.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { refresh(); }, [creator]);

  const post = async () => {
    if (!creator || !title || !content) return;
    const { error } = await supabase.from("creator_announcements").insert({
      creator_id: creator.id, title, content, audience,
    });
    if (error) return toast.error(error.message);
    toast.success("Posted");
    setTitle(""); setContent("");
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("creator_announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card-soft">
        <h2 className="text-lg font-bold text-ink">New update</h2>
        <div className="mt-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inp} />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell your members what's new…" rows={6} className={inp} />
          <select value={audience} onChange={(e) => setAudience(e.target.value as any)} className={inp}>
            <option value="everyone">Everyone (public)</option>
            <option value="followers">Followers only</option>
            <option value="subscribers">Active subscribers only</option>
          </select>
          <button onClick={post} className="btn-primary w-full"><Send className="mr-2 h-4 w-4" />Post update</button>
        </div>
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold text-ink">Recent updates</h2>
        {items.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No updates yet"
            description="Send a quick note to followers, subscribers, or a specific tier. Great for new drops, behind-the-scenes, or polls."
          />
        ) : (
          <ul className="mt-3 grid gap-3">
            {items.map((i) => (
              <li key={i.id} className="card-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">{i.title}</h3>
                    <div className="text-xs text-ink-soft">{new Date(i.created_at).toLocaleString()} · {i.audience}</div>
                  </div>
                  <button onClick={() => remove(i.id)} className="text-ink-soft hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{i.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
