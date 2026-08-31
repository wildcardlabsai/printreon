import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader, StatCard, EmptyState, StatusBadge } from "@/components/admin/AdminUI";
import {
  adminInboxList,
  adminInboxUpdate,
  adminSendBetaInvite,
  adminSendEmailSelfTest,
  type InboxItem,
} from "@/functions/inbox.functions";

export const Route = createFileRoute("/admin/inbox")({
  head: () => ({ meta: [{ title: "Inbox — Printreon Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminInbox,
});

type Kind = "all" | "feedback" | "application" | "contact";

const KIND_LABEL: Record<string, string> = {
  feedback: "Feedback",
  application: "Application",
  contact: "Contact",
};

const STATUSES: Record<string, string[]> = {
  feedback: ["new", "reviewing", "done"],
  contact: ["open", "pending", "closed"],
  application: ["pending", "shortlisted", "invited", "accepted", "rejected"],
};

function AdminInbox() {
  const list = useServerFn(adminInboxList);
  const update = useServerFn(adminInboxUpdate);
  const invite = useServerFn(adminSendBetaInvite);
  const selfTest = useServerFn(adminSendEmailSelfTest);

  const [kind, setKind] = useState<Kind>("all");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<{ items: InboxItem[]; tally: Record<string, number> } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setData(null);
    try {
      setData((await list({ data: { kind, search } })) as any);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load the inbox");
      setData({ items: [], tally: {} });
    }
  }, [kind, search, list]);

  useEffect(() => {
    const t = setTimeout(refresh, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [refresh, search]);

  const tally = data?.tally ?? {};

  return (
    <div className="p-8">
      <PageHeader
        title="Inbox"
        subtitle="Feedback, beta applications and contact messages in one place — no Gmail needed."
        actions={
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await selfTest({ data: undefined });
                toast.success("Test invite + feedback email sent to mattoftaylor@gmail.com");
              } catch (e: any) {
                toast.error(e?.message ?? "Test send failed");
              } finally {
                setBusy(false);
              }
            }}
            className="btn-ghost h-9 text-xs"
          >
            Send delivery test
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={tally['total'] ?? 0} />
        <StatCard label="Feedback" value={tally['feedback'] ?? 0} />
        <StatCard label="Applications" value={tally['application'] ?? 0} />
        <StatCard label="Needs action" value={tally['unread'] ?? 0} />
      </div>

      <div className="my-5 flex flex-wrap items-center gap-2">
        {(["all", "feedback", "application", "contact"] as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              kind === k ? "bg-primary text-primary-foreground" : "bg-secondary text-ink-soft"
            }`}
          >
            {k}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email or message…"
          className="ml-auto w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {data === null ? (
        <div className="text-ink-soft">Loading…</div>
      ) : data.items.length === 0 ? (
        <EmptyState title="Nothing here yet" description="Feedback, applications and contact messages land here." />
      ) : (
        <div className="space-y-2">
          {data.items.map((item) => {
            const open = openId === `${item.kind}:${item.id}`;
            return (
              <div key={`${item.kind}:${item.id}`} className="rounded-lg border border-border bg-card">
                <button
                  onClick={() => setOpenId(open ? null : `${item.kind}:${item.id}`)}
                  className="flex w-full flex-wrap items-center gap-3 p-4 text-left"
                >
                  <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase text-ink-soft">
                    {KIND_LABEL[item.kind]}
                  </span>
                  <span className="font-semibold text-ink">{item.subject}</span>
                  <span className="text-xs text-ink-soft">{item.fromName || item.fromEmail}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="text-xs text-ink-soft">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>
                </button>

                {open && (
                  <div className="border-t border-border p-4">
                    <div className="text-xs text-ink-soft">
                      {item.fromEmail} · {new Date(item.createdAt).toLocaleString()}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{item.body}</p>

                    {Object.keys(item.meta ?? {}).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(item.meta)
                          .filter(([, v]) => v !== null && v !== undefined && v !== "")
                          .map(([k, v]) => (
                            <span key={k} className="rounded bg-secondary px-2 py-1 text-[11px] text-ink-soft">
                              {k}: {String(v)}
                            </span>
                          ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {(STATUSES[item.kind] ?? []).map((s) => (
                        <button
                          key={s}
                          disabled={item.status === s}
                          onClick={async () => {
                            try {
                              await update({ data: { kind: item.kind, id: item.id, status: s } });
                              toast.success(`Marked ${s}`);
                              refresh();
                            } catch (e: any) {
                              toast.error(e?.message ?? "Update failed");
                            }
                          }}
                          className="btn-ghost h-8 text-xs disabled:opacity-40"
                        >
                          Mark {s}
                        </button>
                      ))}
                      <a href={`mailto:${item.fromEmail}`} className="btn-ghost h-8 text-xs">
                        Reply by email
                      </a>
                      {item.kind === "application" && (
                        <button
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            try {
                              const r: any = await invite({
                                data: {
                                  email: item.fromEmail,
                                  name: item.fromName ?? "",
                                  applicationId: item.id,
                                },
                              });
                              toast.success(
                                r?.sent === false
                                  ? "Recipient is suppressed — no email sent"
                                  : `Invite sent (${r?.inviteCode})`,
                              );
                              refresh();
                            } catch (e: any) {
                              toast.error(e?.message ?? "Invite failed");
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                        >
                          Send beta invite
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        value={notes[item.id] ?? item.notes ?? ""}
                        onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                        placeholder="Internal notes"
                        className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await update({
                              data: { kind: item.kind, id: item.id, notes: notes[item.id] ?? item.notes ?? "" },
                            });
                            toast.success("Note saved");
                            refresh();
                          } catch (e: any) {
                            toast.error(e?.message ?? "Could not save note");
                          }
                        }}
                        className="btn-ghost h-9 text-xs"
                      >
                        Save note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
