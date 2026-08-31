import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/feedback")({ component: AdminFeedback });

type Row = {
  id: string;
  name: string | null;
  email: string;
  type: string;
  message: string;
  status: string;
  admin_notes: string | null;
  page_url: string | null;
  created_at: string;
};

function AdminFeedback() {
  const [rows, setRows] = useState<Row[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const refresh = async () => {
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (typeFilter === "all" || r.type === typeFilter) &&
          (statusFilter === "all" || r.status === statusFilter),
      ),
    [rows, typeFilter, statusFilter],
  );

  const update = async (id: string, patch: Partial<Row>) => {
    const { error } = await supabase.from("feedback").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  return (
    <div className="p-8">
      <PageHeader title="Feedback" subtitle="Ideas, bug reports and comments submitted from the site." />

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All types</option>
          <option value="idea">Ideas</option>
          <option value="bug">Bugs</option>
          <option value="other">Other</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="done">Done</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No feedback matches these filters." />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {r.name || r.email}{" "}
                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase text-ink-soft">{r.type}</span>
                  </div>
                  <div className="text-xs text-ink-soft">
                    {r.email} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.message}</p>
              {r.page_url && <p className="mt-1 truncate text-xs text-ink-soft">from {r.page_url}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(["new", "reviewing", "done"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update(r.id, { status: s })}
                    disabled={r.status === s}
                    className="btn-ghost h-8 text-xs disabled:opacity-40"
                  >
                    Mark {s}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={notesDraft[r.id] ?? r.admin_notes ?? ""}
                  onChange={(e) => setNotesDraft({ ...notesDraft, [r.id]: e.target.value })}
                  placeholder="Internal notes"
                  className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={() => update(r.id, { admin_notes: notesDraft[r.id] ?? r.admin_notes ?? "" })}
                  className="btn-ghost h-9 text-xs"
                >
                  Save note
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
