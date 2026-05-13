import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/announcements")({ component: Announcements });

function Announcements() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");

  const refresh = async () => {
    const { data } = await supabase.from("platform_announcements").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const create = async (status: "draft" | "published") => {
    if (!title || !body) return toast.error("Title and body required");
    const { error } = await supabase.from("platform_announcements").insert({
      title, body, audience, status,
      published_at: status === "published" ? new Date().toISOString() : null,
      created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    await supabase.from("admin_activity_log").insert({ action: `announcement.${status}`, target_type: "platform_announcement", metadata: { title, audience } });
    setTitle(""); setBody("");
    refresh();
    toast.success(`Saved as ${status}`);
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("platform_announcements").update(patch).eq("id", id);
    refresh();
  };

  return (
    <div className="p-8">
      <PageHeader title="Announcements" subtitle="Broadcast to users, creators, or beta members." />

      <div className="rounded-lg border border-border bg-card p-4 mb-6">
        <h3 className="font-semibold mb-3">New announcement</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full rounded border border-input bg-background px-3 py-2 text-sm mb-2" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" rows={4} className="w-full rounded border border-input bg-background px-3 py-2 text-sm mb-2" />
        <div className="flex gap-2">
          <select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm">
            <option value="all">Everyone</option>
            <option value="creators">Creators</option>
            <option value="beta_users">Beta users</option>
            <option value="admins">Admins</option>
          </select>
          <button onClick={() => create("draft")} className="btn-ghost">Save draft</button>
          <button onClick={() => create("published")} className="btn-primary">Publish</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No announcements yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-ink-soft">audience: {a.audience}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{a.body}</p>
              <div className="mt-3 flex gap-2">
                {a.status !== "published" && <button onClick={() => update(a.id, { status: "published", published_at: new Date().toISOString() })} className="btn-ghost h-8 text-xs">Publish</button>}
                {a.status !== "archived" && <button onClick={() => update(a.id, { status: "archived" })} className="btn-ghost h-8 text-xs">Archive</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
