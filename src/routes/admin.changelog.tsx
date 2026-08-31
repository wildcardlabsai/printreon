import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/changelog")({ component: AdminChangelog });

type Entry = {
  id: string;
  title: string;
  body: string;
  entry_date: string;
  is_published: boolean;
};

function AdminChangelog() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [editing, setEditing] = useState<Entry | null>(null);

  const refresh = async () => {
    const { data } = await supabase
      .from("changelog_entries")
      .select("id,title,body,entry_date,is_published")
      .order("entry_date", { ascending: false });
    setRows((data as Entry[]) ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const create = async (publish: boolean) => {
    if (!title.trim() || !body.trim()) return toast.error("Title and body required");
    const { error } = await supabase.from("changelog_entries").insert({
      title: title.trim(),
      body: body.trim(),
      entry_date: entryDate,
      is_published: publish,
      created_by: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    setTitle(""); setBody("");
    toast.success(publish ? "Entry published" : "Draft saved");
    refresh();
  };

  const update = async (id: string, patch: Partial<Entry>) => {
    const { error } = await supabase.from("changelog_entries").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this changelog entry?")) return;
    const { error } = await supabase.from("changelog_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  const saveEdit = async () => {
    if (!editing) return;
    await update(editing.id, {
      title: editing.title,
      body: editing.body,
      entry_date: editing.entry_date,
    });
    setEditing(null);
    toast.success("Updated");
  };

  return (
    <div className="p-8">
      <PageHeader title="Changelog" subtitle="Publish product updates to the public /changelog page." />

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">New entry</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="mb-2 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="What changed?" rows={4} className="mb-2 w-full rounded border border-input bg-background px-3 py-2 text-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm" />
          <button onClick={() => create(false)} className="btn-ghost">Save draft</button>
          <button onClick={() => create(true)} className="btn-primary">Publish</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No changelog entries yet." />
      ) : (
        <div className="space-y-2">
          {rows.map((e) => (
            <div key={e.id} className="rounded-lg border border-border bg-card p-4">
              {editing?.id === e.id ? (
                <div className="space-y-2">
                  <input value={editing.title} onChange={(ev) => setEditing({ ...editing, title: ev.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm" />
                  <textarea value={editing.body} rows={4} onChange={(ev) => setEditing({ ...editing, body: ev.target.value })} className="w-full rounded border border-input bg-background px-3 py-2 text-sm" />
                  <input type="date" value={editing.entry_date} onChange={(ev) => setEditing({ ...editing, entry_date: ev.target.value })} className="rounded border border-input bg-background px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="btn-primary h-8 text-xs">Save</button>
                    <button onClick={() => setEditing(null)} className="btn-ghost h-8 text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{e.title}</div>
                      <div className="text-xs text-ink-soft">{e.entry_date}</div>
                    </div>
                    <StatusBadge status={e.is_published ? "published" : "draft"} />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{e.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setEditing(e)} className="btn-ghost h-8 text-xs">Edit</button>
                    <button onClick={() => update(e.id, { is_published: !e.is_published })} className="btn-ghost h-8 text-xs">
                      {e.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => remove(e.id)} className="btn-ghost h-8 text-xs text-destructive">Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
