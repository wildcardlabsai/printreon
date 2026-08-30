// Notify followers / subscribers when a creator publishes a new file or post.
// Inserts in-app notifications + queues emails (respects notification_prefs).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { enqueueEmail } from "@/server/email.server";

const SITE = "https://printreon.com";

const Input = z.object({
  kind: z.enum(["file", "post"]),
  itemId: z.string().uuid(),
});

export const notifyOnPublish = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Verify caller owns the creator that owns the item.
    const table = data.kind === "file" ? "creator_files" : "creator_posts";
    const { data: item } = (await supabaseAdmin
      .from(table)
      .select("id, title, creator_id")
      .eq("id", data.itemId)
      .maybeSingle()) as { data: { id: string; title: string; creator_id: string } | null };
    if (!item) throw new Error("Item not found");

    const { data: creator } = await supabaseAdmin
      .from("creator_profiles")
      .select("id, slug, display_name, user_id")
      .eq("id", item.creator_id)
      .maybeSingle();
    if (!creator || creator.user_id !== userId) throw new Error("Not authorized");

    // Build recipient set: followers + active subscribers (deduped).
    const [{ data: follows }, { data: subs }] = await Promise.all([
      supabaseAdmin.from("followers").select("user_id").eq("creator_id", creator.id),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, tier_id")
        .eq("creator_id", creator.id)
        .eq("status", "active"),
    ]);

    const recipients = new Set<string>();
    (follows ?? []).forEach((r: any) => recipients.add(r.user_id));
    (subs ?? []).forEach((r: any) => recipients.add(r.user_id));
    recipients.delete(userId); // don't notify the creator

    if (recipients.size === 0) return { notified: 0 };

    const link =
      data.kind === "file"
        ? `${SITE}/c/${creator.slug}#files`
        : `${SITE}/c/${creator.slug}#posts`;
    const title =
      data.kind === "file"
        ? `${creator.display_name} dropped a new file`
        : `${creator.display_name} posted an update`;
    const body = item.title;

    // In-app notifications (bulk insert).
    const userIds = [...recipients];
    await supabaseAdmin.from("notifications").insert(
      userIds.map((uid) => ({
        user_id: uid,
        type: data.kind === "file" ? "new_file" : "new_post",
        title,
        body,
        link,
      })),
    );

    // Pull profile emails + opt-in prefs.
    const [{ data: profiles }, { data: prefs }] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, email, full_name").in("user_id", userIds),
      supabaseAdmin
        .from("notification_prefs")
        .select("user_id, email_new_file, email_new_post")
        .in("user_id", userIds),
    ]);
    const prefByUser = new Map(
      (prefs ?? []).map((p: any) => [p.user_id, p] as const),
    );

    let emailed = 0;
    await Promise.allSettled(
      (profiles ?? []).map(async (p: any) => {
        if (!p.email) return;
        const pref = prefByUser.get(p.user_id);
        const optIn =
          data.kind === "file"
            ? pref?.email_new_file ?? true
            : pref?.email_new_post ?? true;
        if (!optIn) return;
        emailed++;
        await enqueueEmail({
          to: p.email,
          subject: `${title}: ${item.title}`,
          html: emailHtml({
            recipientName: p.full_name ?? "there",
            creatorName: creator.display_name,
            itemTitle: item.title,
            kind: data.kind,
            link,
          }),
        });
      }),
    );

    return { notified: userIds.length, emailed };
  });

function emailHtml(o: {
  recipientName: string;
  creatorName: string;
  itemTitle: string;
  kind: "file" | "post";
  link: string;
}): string {
  const verb = o.kind === "file" ? "uploaded a new file" : "published a new update";
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#f7f6f2;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
      <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a">Hi ${escape(o.recipientName)},</h1>
      <p style="color:#444;line-height:1.5;margin:0 0 16px"><strong>${escape(o.creatorName)}</strong> just ${verb} on Printreon:</p>
      <p style="font-size:18px;font-weight:700;margin:0 0 20px;color:#1a1a1a">${escape(o.itemTitle)}</p>
      <a href="${o.link}" style="display:inline-block;background:#ff6b35;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">View on Printreon</a>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0"/>
      <p style="font-size:12px;color:#888">You're receiving this because you follow or subscribe to ${escape(o.creatorName)} on <a href="${SITE}" style="color:#888">printreon.com</a>. Manage email preferences in your <a href="${SITE}/me/notifications" style="color:#888">notification settings</a>.</p>
      <p style="font-size:12px;color:#888;margin-top:8px">Printreon is partnered with <a href="https://www.makermindapp.com" style="color:#888">MakerMind App</a>.</p>
    </div>
  </body></html>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
