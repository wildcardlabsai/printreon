import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import {
  adminListReports,
  adminResolveReport,
  adminSuspendCreator,
  adminTakedownFile,
} from "@/functions/moderation.functions";

export const Route = createFileRoute("/admin/reports")({ component: Reports });

type Filter = "open" | "resolved" | "all";

function Reports() {
  const list = useServerFn(adminListReports);
  const resolve = useServerFn(adminResolveReport);
  const suspend = useServerFn(adminSuspendCreator);
  const takedown = useServerFn(adminTakedownFile);

  const [filter, setFilter] = useState<Filter>("open");
  const [rows, setRows] = useState<any[] | null>(null);

  const refresh = useCallback(async () => {
    setRows(null);
    try {
      const data = await list({ data: { status: filter } });
      setRows(data as any[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load reports");
      setRows([]);
    }
  }, [filter, list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    }
  };

  return (
    <div className="p-8">
      <PageHeader title="Moderation" subtitle="Reports, creator suspensions and DMCA takedowns" />

      <div className="mb-4 flex gap-2">
        {(["open", "resolved", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-ink-soft"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="text-ink-soft">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nothing in the queue"
          description="Reports raised by members against creators, files, posts or comments land here."
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => {
            const creator = r.creator_profiles;
            const file = r.creator_files;
            return (
              <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={r.status} />
                  <span className="capitalize text-ink-soft">{r.parent_type ?? "creator"}</span>
                  <span className="text-ink-soft">·</span>
                  <span className="text-ink-soft">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  {r.reporter_email && (
                    <span className="text-ink-soft">· by {r.reporter_email}</span>
                  )}
                </div>

                <p className="mt-2 text-ink">{r.reason}</p>

                <div className="mt-2 text-sm text-ink-soft">
                  {creator && (
                    <div>
                      Creator: <span className="text-ink">{creator.display_name}</span>
                      {creator.suspended_at && <span className="text-red-600"> — suspended</span>}
                    </div>
                  )}
                  {file && (
                    <div>
                      File: <span className="text-ink">{file.title}</span>
                      {file.takedown_at && <span className="text-red-600"> — taken down</span>}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "open" && (
                    <>
                      <button
                        className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700"
                        onClick={() =>
                          act(
                            () => resolve({ data: { reportId: r.id, status: "resolved" } }),
                            "Report resolved"
                          )
                        }
                      >
                        Resolve
                      </button>
                      <button
                        className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-ink-soft"
                        onClick={() =>
                          act(
                            () => resolve({ data: { reportId: r.id, status: "rejected" } }),
                            "Report dismissed"
                          )
                        }
                      >
                        Dismiss
                      </button>
                    </>
                  )}

                  {r.creator_id && (
                    <button
                      className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600"
                      onClick={() => {
                        const suspending = !creator?.suspended_at;
                        const reason = suspending
                          ? prompt("Suspension reason?") ?? undefined
                          : undefined;
                        if (suspending && !reason) return;
                        act(
                          () =>
                            suspend({
                              data: { creatorId: r.creator_id, suspend: suspending, reason },
                            }),
                          suspending ? "Creator suspended" : "Creator restored"
                        );
                      }}
                    >
                      {creator?.suspended_at ? "Restore creator" : "Suspend creator"}
                    </button>
                  )}

                  {r.file_id && (
                    <button
                      className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600"
                      onClick={() => {
                        const taking = !file?.takedown_at;
                        const reason = taking ? prompt("Takedown reason (DMCA)?") ?? undefined : undefined;
                        if (taking && !reason) return;
                        act(
                          () => takedown({ data: { fileId: r.file_id, takedown: taking, reason } }),
                          taking ? "File taken down" : "File restored"
                        );
                      }}
                    >
                      {file?.takedown_at ? "Restore file" : "Take down file"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
