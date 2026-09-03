import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Admin only");
}

const SetPublishedInput = z.object({ creatorId: z.string().uuid(), isPublished: z.boolean() });
export const adminSetPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SetPublishedInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("creator_profiles")
      .update({ is_published: data.isPublished })
      .eq("id", data.creatorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Publishes a creator page and sends them the branded welcome email. */
const ActivateCreatorInput = z.object({ creatorId: z.string().uuid() });
export const adminActivateCreator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ActivateCreatorInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: cp, error: cpErr } = await supabaseAdmin
      .from("creator_profiles")
      .select("id, user_id, display_name, slug, is_published")
      .eq("id", data.creatorId)
      .maybeSingle();
    if (cpErr || !cp) throw new Error("Creator not found");

    if (!cp.is_published) {
      const { error } = await supabaseAdmin
        .from("creator_profiles")
        .update({ is_published: true })
        .eq("id", cp.id);
      if (error) throw new Error(error.message);
    }

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", cp.user_id)
      .maybeSingle();


    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: cp.user_id, role: "creator" }, { onConflict: "user_id,role" });

    let emailed: { sent: boolean; reason?: string } = { sent: false, reason: "no_email" };
    if (prof?.email) {
      try {
        const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
        const r = await sendTemplateEmail("creator-welcome", prof.email, {
          templateData: {
            name: cp.display_name || prof.full_name || undefined,
            slug: cp.slug,
          },
          idempotencyKey: `creator-welcome-${cp.id}`,
        });
        emailed = r.sent ? { sent: true } : { sent: false, reason: r.reason };
      } catch (e: any) {
        console.error("[email] creator-welcome failed:", e?.message ?? e);
        emailed = { sent: false, reason: "error" };
      }
    }

    await supabaseAdmin.from("admin_activity_log").insert({
      action: "creator.activated",
      target_type: "creator_profile",
      target_id: cp.id,
      metadata: { emailed },
    });

    return { ok: true, emailed, email: prof?.email ?? null };
  });

const GrantRoleInput = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "creator", "member"]),
});
export const adminGrantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => GrantRoleInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", data.email)
      .maybeSingle();
    if (!prof) throw new Error("No user with that email");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: prof.user_id, role: data.role }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSubscribersForCreator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ creatorId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("*, creator_tiers(name, price)")
      .eq("creator_id", data.creatorId);
    const userIds = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    return (subs ?? []).map((s: any) => ({ ...s, profile: map.get(s.user_id) ?? null }));
  });

export const listSubscribersForOwnCreator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ creatorId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Verify the user owns this creator profile
    const { data: own } = await supabaseAdmin
      .from("creator_profiles")
      .select("id")
      .eq("id", data.creatorId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!own) throw new Error("Not allowed");

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("*, creator_tiers(name, price)")
      .eq("creator_id", data.creatorId)
      .order("created_at", { ascending: false });

    const userIds = Array.from(new Set((subs ?? []).map((s: any) => s.user_id)));
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, full_name, avatar_url")
      .in("user_id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
    return (subs ?? []).map((s: any) => ({ ...s, profile: map.get(s.user_id) ?? null }));
  });
