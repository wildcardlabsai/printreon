import { createFileRoute } from "@tanstack/react-router";

/**
 * Publishes files and posts whose scheduled_at has passed.
 * Call on a schedule with the x-cron-secret header set to CRON_SECRET.
 */
export const Route = createFileRoute("/api/public/cron/publish-scheduled")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-secret") ?? "";
        const accepted = [process.env["CRON_SECRET"], process.env["CRON_JOB_TOKEN"]].filter(
          (s): s is string => Boolean(s)
        );
        if (!accepted.some((s) => s.length === provided.length && s === provided)) {
          return new Response("Unauthorized", { status: 401 });
        }


        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();

        const { data: files } = await supabaseAdmin
          .from("creator_files")
          .update({ status: "published", is_published: true, updated_at: now })
          .eq("status", "scheduled")
          .is("takedown_at", null)
          .lte("scheduled_at", now)
          .select("id, creator_id, title, slug");

        const { data: posts } = await supabaseAdmin
          .from("creator_posts")
          .update({ status: "published", published_at: now, updated_at: now })
          .eq("status", "scheduled")
          .lte("scheduled_at", now)
          .select("id, creator_id, title");

        // Notify followers of each creator whose content just went live.
        const creatorIds = Array.from(
          new Set([...(files ?? []), ...(posts ?? [])].map((r: any) => r.creator_id))
        );
        let notified = 0;
        for (const creatorId of creatorIds) {
          const { data: followers } = await supabaseAdmin
            .from("followers")
            .select("user_id")
            .eq("creator_id", creatorId);
          const items = [
            ...(files ?? []).filter((f: any) => f.creator_id === creatorId),
            ...(posts ?? []).filter((p: any) => p.creator_id === creatorId),
          ];
          for (const follower of followers ?? []) {
            for (const item of items) {
              await supabaseAdmin.from("notifications").insert({
                user_id: follower.user_id,
                type: "scheduled_publish",
                title: `New drop: ${item.title}`,
                body: "A creator you follow just published something new.",
                link: "/me/following",
              });
              notified += 1;
            }
          }
        }

        return Response.json({
          ok: true,
          files: files?.length ?? 0,
          posts: posts?.length ?? 0,
          notified,
        });
      },
    },
  },
});
