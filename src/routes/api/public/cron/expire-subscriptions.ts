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

        return Response.json({ ok: true, expired: data?.length ?? 0 });
      },
    },
  },
});
