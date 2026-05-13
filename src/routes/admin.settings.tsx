import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminUI";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

const SETTING_KEYS = ["platform_name", "beta_mode", "invite_only_mode", "allow_public_signup", "default_creator_status", "support_email", "maintenance_banner"];

function Settings() {
  const [vals, setVals] = useState<Record<string, string>>({
    platform_name: "Printreon", beta_mode: "true", invite_only_mode: "true", allow_public_signup: "false",
    default_creator_status: "pending", support_email: "support@printreon.com", maintenance_banner: "",
  });

  useEffect(() => { (async () => {
    const { data } = await supabase.from("feature_flags").select("key, description").in("key", SETTING_KEYS.map((k) => `setting.${k}`));
    const next = { ...vals };
    (data ?? []).forEach((r: any) => { next[r.key.replace("setting.", "")] = r.description ?? next[r.key.replace("setting.", "")]; });
    setVals(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })(); }, []);

  const save = async () => {
    for (const k of SETTING_KEYS) {
      await supabase.from("feature_flags").upsert({ key: `setting.${k}`, name: k, description: vals[k] ?? "", enabled: true }, { onConflict: "key" });
    }
    await supabase.from("admin_activity_log").insert({ action: "settings.updated", target_type: "feature_flag" });
    toast.success("Settings saved");
  };

  const Field = ({ k, label, type = "text" }: { k: string; label: string; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold uppercase text-ink-soft mb-1">{label}</label>
      <input
        type={type}
        value={vals[k] ?? ""}
        onChange={(e) => setVals({ ...vals, [k]: e.target.value })}
        className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="Settings" subtitle="Platform-wide configuration." />
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        <Field k="platform_name" label="Platform name" />
        <Field k="support_email" label="Support email" type="email" />
        <Field k="default_creator_status" label="Default creator status (none / pending / active)" />
        <Field k="maintenance_banner" label="Maintenance banner (leave blank to hide)" />
        <div className="grid grid-cols-3 gap-3">
          <Field k="beta_mode" label="Beta mode (true/false)" />
          <Field k="invite_only_mode" label="Invite only (true/false)" />
          <Field k="allow_public_signup" label="Public signup (true/false)" />
        </div>
        <button onClick={save} className="btn-primary mt-2">Save settings</button>
      </div>
    </div>
  );
}
