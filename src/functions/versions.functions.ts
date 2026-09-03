import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface FileVersionRow {
  id: string;
  version: number;
  changelog: string | null;
  fileSize: number | null;
  createdAt: string;
}

const ListInput = z.object({ fileId: z.string().uuid() });

const PublishInput = z.object({
  fileId: z.string().uuid(),
  filePath: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  fileType: z.string().min(1).max(20),
  changelog: z.string().trim().min(3).max(1000),
  notify: z.boolean().optional(),
});

/**
 * Version history for a file. Owners always see it; everyone else only when the
 * file is published (the storage path is never returned).
 */
export const listFileVersions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ListInput.parse(d))
  .handler(async ({ data, context }): Promise<FileVersionRow[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: file } = await supabaseAdmin
      .from("creator_files")
      .select("id, creator_id, is_published")
      .eq("id", data.fileId)
      .maybeSingle();
    if (!file) return [];

    if (!file.is_published) {
      const { data: owned } = await supabaseAdmin
        .from("creator_profiles")
        .select("id")
        .eq("id", file.creator_id)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (!owned) return [];
    }

    const { data: rows } = await supabaseAdmin
      .from("file_versions")
      .select("id, version, changelog, file_size, created_at")
      .eq("file_id", data.fileId)
      .order("version", { ascending: false });

    return (rows ?? []).map((r) => ({
      id: r.id,
      version: r.version,
      changelog: r.changelog,
      fileSize: r.file_size == null ? null : Number(r.file_size),
      createdAt: r.created_at,
    }));
  });

/**
 * Replaces the live file with a newly uploaded object, records both the old and
 * the new revision in file_versions, and (optionally) tells everyone who has
 * downloaded the file that a new version is available.
 */
export const publishFileVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => PublishInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: file } = await supabaseAdmin
      .from("creator_files")
      .select("id, creator_id, title, slug, version, file_url, file_size")
      .eq("id", data.fileId)
      .maybeSingle();
    if (!file) throw new Error("File not found");

    const { data: owned } = await supabaseAdmin
      .from("creator_profiles")
      .select("id, display_name, slug")
      .eq("id", file.creator_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!owned) throw new Error("You do not have permission to update this file");

    const currentVersion = Number(file.version ?? 1);

    // Archive the version that is being replaced (once).
    if (file.file_url) {
      const { data: existing } = await supabaseAdmin
        .from("file_versions")
        .select("id")
        .eq("file_id", file.id)
        .eq("version", currentVersion)
        .maybeSingle();
      if (!existing) {
        await supabaseAdmin.from("file_versions").insert({
          file_id: file.id,
          version: currentVersion,
          file_url: file.file_url,
          file_size: file.file_size,
          changelog: "Original upload",
        });
      }
    }

    const nextVersion = currentVersion + 1;

    const { error: insErr } = await supabaseAdmin.from("file_versions").insert({
      file_id: file.id,
      version: nextVersion,
      file_url: data.filePath,
      file_size: data.fileSize,
      changelog: data.changelog,
    });
    if (insErr) throw new Error(insErr.message);

    const { error: updErr } = await supabaseAdmin
      .from("creator_files")
      .update({
        file_url: data.filePath,
        file_size: data.fileSize,
        file_type: data.fileType,
        version: nextVersion,
      })
      .eq("id", file.id);
    if (updErr) throw new Error(updErr.message);

    let notified = 0;
    if (data.notify !== false) {
      const { data: downloaders } = await supabaseAdmin
        .from("downloads")
        .select("user_id")
        .eq("file_id", file.id);
      const userIds = Array.from(new Set((downloaders ?? []).map((d) => d.user_id))).filter(
        (id) => id !== context.userId,
      );
      if (userIds.length > 0) {
        const rows = userIds.map((uid) => ({
          user_id: uid,
          type: "file_updated",
          title: `${file.title} was updated to v${nextVersion}`,
          body: data.changelog,
          link: `/c/${owned.slug}`,
        }));
        const { error } = await supabaseAdmin.from("notifications").insert(rows);
        if (!error) notified = rows.length;
      }
    }

    return { version: nextVersion, notified };
  });
