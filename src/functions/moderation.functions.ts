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

async function logAdminAction(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown> = {}
) {
  await supabaseAdmin.from("admin_activity_log").insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: metadata as never,
  });
}

/** Any signed-in member can flag a creator, file or comment. */
export const submitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        reason: z.string().min(5).max(1000),
        creatorId: z.string().uuid().optional(),
        fileId: z.string().uuid().optional(),
        parentType: z.enum(["creator", "file", "comment", "post"]).default("creator"),
        parentId: z.string().uuid().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin.from("admin_reports").insert({
      reported_by: context.userId,
      creator_id: data.creatorId ?? null,
      file_id: data.fileId ?? null,
      parent_type: data.parentType,
      parent_id: data.parentId ?? null,
      reason: data.reason,
      status: "open",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin moderation queue with joined context. */
export const adminListReports = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ status: z.enum(["open", "resolved", "all"]).default("open") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    let q = supabaseAdmin
      .from("admin_reports")
      .select(
        "id, reason, status, parent_type, created_at, resolved_at, resolution_notes, creator_id, file_id, reported_by, creator_profiles(display_name, slug, suspended_at), creator_files(title, slug, takedown_at)"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const reporterIds = Array.from(
      new Set((rows ?? []).map((r: any) => r.reported_by).filter(Boolean))
    );
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email")
      .in("user_id", reporterIds.length ? reporterIds : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profs ?? []).map((p: any) => [p.user_id, p.email]));
    return (rows ?? []).map((r: any) => ({ ...r, reporter_email: map.get(r.reported_by) ?? null }));
  });

export const adminResolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        reportId: z.string().uuid(),
        status: z.enum(["open", "resolved", "rejected"]),
        notes: z.string().max(1000).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("admin_reports")
      .update({
        status: data.status,
        resolved_at: data.status === "open" ? null : new Date().toISOString(),
        resolved_by: data.status === "open" ? null : context.userId,
        resolution_notes: data.notes ?? null,
      })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, `report_${data.status}`, "report", data.reportId, {
      notes: data.notes ?? null,
    });
    return { ok: true };
  });

/** Suspend (or restore) a creator. Suspension unpublishes the page immediately. */
export const adminSuspendCreator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        creatorId: z.string().uuid(),
        suspend: z.boolean(),
        reason: z.string().max(500).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: creator } = await supabaseAdmin
      .from("creator_profiles")
      .select("id, user_id, display_name")
      .eq("id", data.creatorId)
      .maybeSingle();
    if (!creator) throw new Error("Creator not found");

    const { error } = await supabaseAdmin
      .from("creator_profiles")
      .update({
        suspended_at: data.suspend ? new Date().toISOString() : null,
        suspension_reason: data.suspend ? data.reason ?? "Policy violation" : null,
        ...(data.suspend ? { is_published: false } : {}),
      })
      .eq("id", data.creatorId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("notifications").insert({
      user_id: creator.user_id,
      type: data.suspend ? "creator_suspended" : "creator_restored",
      title: data.suspend ? "Your creator page has been suspended" : "Your creator page has been restored",
      body: data.suspend ? data.reason ?? "Contact support for details." : "Everything is live again.",
      link: "/dashboard",
    });

    await logAdminAction(
      context.userId,
      data.suspend ? "suspend_creator" : "restore_creator",
      "creator",
      data.creatorId,
      { reason: data.reason ?? null }
    );
    return { ok: true };
  });

/** DMCA / policy takedown on a single file. */
export const adminTakedownFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        fileId: z.string().uuid(),
        takedown: z.boolean(),
        reason: z.string().max(500).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: file } = await supabaseAdmin
      .from("creator_files")
      .select("id, title, creator_id, creator_profiles(user_id)")
      .eq("id", data.fileId)
      .maybeSingle();
    if (!file) throw new Error("File not found");

    const { error } = await supabaseAdmin
      .from("creator_files")
      .update({
        takedown_at: data.takedown ? new Date().toISOString() : null,
        takedown_reason: data.takedown ? data.reason ?? "DMCA takedown" : null,
        ...(data.takedown ? { is_published: false } : {}),
      })
      .eq("id", data.fileId);
    if (error) throw new Error(error.message);

    const ownerId = (file as any).creator_profiles?.user_id;
    if (ownerId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: ownerId,
        type: data.takedown ? "file_takedown" : "file_restored",
        title: data.takedown ? `"${file.title}" was taken down` : `"${file.title}" was restored`,
        body: data.takedown ? data.reason ?? "DMCA / policy takedown." : "The file is available again.",
        link: "/dashboard/files",
      });
    }

    await logAdminAction(
      context.userId,
      data.takedown ? "takedown_file" : "restore_file",
      "file",
      data.fileId,
      { reason: data.reason ?? null }
    );
    return { ok: true };
  });
