import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader, StatCard, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { adminListEmails, adminRetryEmail } from "@/functions/ops.functions";

export const Route = createFileRoute("/admin/emails")({ component: Emails });

type Filter = "all" | "pending" | "sent" | "failed";

function Emails() {
  const list = useServerFn(adminListEmails);
  const retry = useServerFn(adminRetryEmail);
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<{ rows: any[]; tally: Record<string, number> } | null>(null);

  const refresh = useCallback(async () => {
    setData(null);
    try {
      setData((await list({ data: { status: filter } })) as any);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load emails");
      setData({ rows: [], tally: {} });
    }
  }, [filter, list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tally = data?.tally ?? {};
  const deliverability = tally.total ? Math.round(((tally.sent ?? 0) / tally.total) * 100) : 0;

  return (
    <div className="p-8">
      <PageHeader title="Email deliverability" subtitle="Every transactional email queued by the platform" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Delivered" value={tally.sent ?? 0} />
        <StatCard label="Failed" value={tally.failed ?? 0} />
        <StatCard label="Pending" value={tally.pending ?? 0} />
        <StatCard label="Delivery rate" value={`${deliverability}%`} />
      </div>

      <div className="my-5 flex gap-2">
        {(["all", "sent", "failed", "pending"] as Filter[]).map((f) => (
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

      {data === null ? (
        <div className="text-ink-soft">Loading…</div>
      ) : data.rows.length === 0 ? (
        <EmptyState title="No emails yet" description="Notifications, dunning and beta emails will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-soft">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">Sent</th>
                <th className="p-3 font-medium">To</th>
                <th className="p-3 font-medium">Subject</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Error</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap p-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3">{r.to_email}</td>
                  <td className="p-3">{r.subject}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="max-w-[240px] truncate p-3 text-xs text-red-600">{r.error ?? ""}</td>
                  <td className="p-3 text-right">
                    {r.status !== "sent" && (
                      <button
                        className="rounded-md bg-secondary px-3 py-1 text-xs font-medium"
                        onClick={async () => {
                          try {
                            await retry({ data: { emailId: r.id } });
                            toast.success("Sent");
                            refresh();
                          } catch (e: any) {
                            toast.error(e?.message ?? "Retry failed");
                          }
                        }}
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
