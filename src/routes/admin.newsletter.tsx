import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader, StatCard, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import { adminNewsletterList, adminNewsletterSetStatus, adminNewsletterResendWelcome } from "@/functions/inbox.functions";

export const Route = createFileRoute("/admin/newsletter")({
  head: () => ({ meta: [{ title: "Newsletter — Printreon Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminNewsletter,
});

type Filter = "all" | "subscribed" | "unsubscribed";

function AdminNewsletter() {
  const list = useServerFn(adminNewsletterList);
  const setStatus = useServerFn(adminNewsletterSetStatus);
  const resendWelcome = useServerFn(adminNewsletterResendWelcome);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<{ rows: any[]; tally: Record<string, number> } | null>(null);

  const refresh = useCallback(async () => {
    setData(null);
    try {
      setData((await list({ data: { status: filter } })) as any);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load subscribers");
      setData({ rows: [], tally: {} });
    }
  }, [filter, list]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const rows = data?.rows ?? [];
  const tally = data?.tally ?? {};

  const exportCsv = () => {
    const header = "email,name,source,status,created_at\n";
    const body = rows
      .map((r) => [r.email, r.name ?? "", r.source ?? "", r.status, r.created_at].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `printreon-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Newsletter list"
        subtitle="Supporters and creators who opted in to product updates."
        actions={
          <button onClick={exportCsv} disabled={rows.length === 0} className="btn-ghost h-9 text-xs disabled:opacity-40">
            Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={tally['total'] ?? 0} />
        <StatCard label="Subscribed" value={tally['subscribed'] ?? 0} />
        <StatCard label="Opted out" value={tally['unsubscribed'] ?? 0} />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm text-ink-soft">
        <strong className="text-ink">Sending updates:</strong> everyone here gets an automatic welcome email
        from Printreon when they subscribe, and you can resend it from any row. Broadcast campaigns are a
        different job. Sending a blast down the same pipe as invites and password resets damages
        deliverability for both, so export this list into a dedicated newsletter tool (Beehiiv, Mailchimp,
        Loops) and send it from a separate subdomain such as <code>news.printreon.com</code>.
      </div>

      <div className="my-5 flex gap-2">
        {(["all", "subscribed", "unsubscribed"] as Filter[]).map((f) => (
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
      ) : rows.length === 0 ? (
        <EmptyState title="No subscribers yet" description="Sign-ups from the site footer and landing page appear here." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-soft">
              <tr className="border-b border-border">
                <th className="p-3 font-medium">Joined</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="whitespace-nowrap p-3">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">{r.email}</td>
                  <td className="p-3">{r.name ?? "—"}</td>
                  <td className="p-3 text-ink-soft">{r.source ?? "site"}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      disabled={busy === r.id}
                      className="rounded-md bg-secondary px-3 py-1 text-xs font-medium disabled:opacity-40"
                      onClick={async () => {
                        setBusy(r.id);
                        try {
                          const res: any = await resendWelcome({ data: { id: r.id } });
                          if (res?.sent) toast.success(`Welcome email sent to ${r.email}`);
                          else if (res?.reason === "recipient_suppressed") toast.warning("Blocked: that address has unsubscribed or bounced.");
                          else toast.warning("The email did not send.");
                        } catch (e: any) {
                          toast.error(e?.message ?? "Send failed");
                        } finally {
                          setBusy(null);
                        }
                      }}
                    >
                      {busy === r.id ? "Sending…" : "Resend welcome"}
                    </button>
                    <button
                      className="rounded-md bg-secondary px-3 py-1 text-xs font-medium"
                      onClick={async () => {
                        try {
                          await setStatus({
                            data: { id: r.id, status: r.status === "subscribed" ? "unsubscribed" : "subscribed" },
                          });
                          refresh();
                        } catch (e: any) {
                          toast.error(e?.message ?? "Update failed");
                        }
                      }}
                    >
                      {r.status === "subscribed" ? "Opt out" : "Re-subscribe"}
                    </button>
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
