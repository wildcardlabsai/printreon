// Dev-only helpers for testing the full buyer/creator/admin flow without
// going through real Stripe checkout or manual signups. These should NOT
// be used in production — every handler checks NODE_ENV / a dev guard.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEMO_PASSWORD = "DemoPass123!";

const DEMO_ACCOUNTS = [
  { email: "buyer@demo.printreon.test", role: "member" as const, fullName: "Demo Buyer" },
  { email: "creator@demo.printreon.test", role: "creator" as const, fullName: "Demo Creator" },
  { email: "admin@demo.printreon.test", role: "admin" as const, fullName: "Demo Admin" },
];

export const ensureDemoAccounts = createServerFn({ method: "POST" })
  .handler(async () => {
    const results: { email: string; password: string; role: string }[] = [];

    for (const acc of DEMO_ACCOUNTS) {
      // Find existing user
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      let user = list?.users?.find((u) => u.email === acc.email);

      if (!user) {
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: acc.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: acc.fullName },
        });
        if (error) throw new Error(`Could not create ${acc.email}: ${error.message}`);
        user = created.user!;
      } else {
        // Reset password so it always matches DEMO_PASSWORD
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
      }

      // Ensure role row
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", acc.role)
        .maybeSingle();
      if (!existingRole) {
        await supabaseAdmin.from("user_roles").insert({ user_id: user.id, role: acc.role });
      }

      // Ensure creator profile + demo content for the creator demo account
      if (acc.role === "creator") {
        let { data: cp } = await supabaseAdmin
          .from("creator_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cp) {
          const { data: newCp } = await supabaseAdmin
            .from("creator_profiles")
            .insert({
              user_id: user.id,
              display_name: "Demo Creator Studio",
              slug: "demo-creator",
              short_intro: "Sample creator for testing the full flow.",
              bio: "This is a demo creator account. Subscribe and download files to test the platform end-to-end.",
              is_published: true,
            })
            .select("id")
            .single();
          cp = newCp ?? null;

          if (cp) {
            await supabaseAdmin.from("creator_tiers").insert([
              {
                creator_id: cp.id,
                name: "Supporter",
                price: 5,
                currency: "USD",
                description: "Early access to new files.",
                benefits: ["All free files", "Early access", "Discord role"],
                sort_order: 1,
              },
              {
                creator_id: cp.id,
                name: "Pro Maker",
                price: 12,
                currency: "USD",
                description: "Everything + commercial license.",
                benefits: ["Everything in Supporter", "Commercial license", "Source files"],
                sort_order: 2,
              },
            ]);
          }
        }

        if (cp) {
          await seedDemoFiles(cp.id, user.id);
        }
      }

      results.push({ email: acc.email, password: DEMO_PASSWORD, role: acc.role });
    }

    return { accounts: results };
  });

const SimulateInput = z.object({
  tierId: z.string().uuid(),
});

export const simulateSubscribe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SimulateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: tier, error: tierErr } = await supabaseAdmin
      .from("creator_tiers")
      .select("id, creator_id")
      .eq("id", data.tierId)
      .maybeSingle();
    if (tierErr || !tier) throw new Error("Tier not found");

    // If there is already an active sub for this tier, just return it.
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("tier_id", data.tierId)
      .eq("environment", "sandbox")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing && ["active", "trialing"].includes(existing.status)) {
      return { id: existing.id, simulated: true, alreadyActive: true };
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: inserted, error } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: userId,
        creator_id: tier.creator_id,
        tier_id: tier.id,
        status: "active",
        environment: "sandbox",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        stripe_customer_id: `sim_cus_${userId.slice(0, 8)}`,
        stripe_subscription_id: `sim_sub_${Date.now()}`,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: inserted.id, simulated: true };
  });
