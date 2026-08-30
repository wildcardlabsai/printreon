import { createFileRoute } from "@tanstack/react-router";

/**
 * Revokes access for subscriptions whose paid period has ended.
 *
 * Stripe webhooks handle this automatically for live subscriptions, but
 * cancelled/simulated ones need a sweep. Call on a schedule with the
 * x-cron-secret header set to CRON_SECRET.
 */
export const Route = createFileRoute("/api/public/cron/expire-subscriptions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        const provided = request.headers.get("x-cron-secret") ?? "";
        if (!secret || provided.length !== secret.length || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();

        const { data, error } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "expired", updated_at: now })
          .in("status", ["active", "trialing", "past_due"])
          .lt("current_period_end", now)
          .select("id");

        if (error) {
          console.error("expire-subscriptions failed", error.message);
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        // Dunning: revoke memberships stuck in past_due for more than 7 days.
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: dunned } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "canceled", updated_at: now })
          .eq("status", "past_due")
          .lt("payment_failed_at", cutoff)
          .select("id, user_id");

        for (const row of dunned ?? []) {
          await supabaseAdmin.from("notifications").insert({
            user_id: row.user_id,
            type: "subscription_revoked",
            title: "Membership paused",
            body: "We couldn't collect payment after several attempts, so access has been paused.",
            link: "/me/subscriptions",
          });
        }

        return Response.json({
          ok: true,
          expired: data?.length ?? 0,
          dunning_canceled: dunned?.length ?? 0,
        });

      },
    },
  },
});
