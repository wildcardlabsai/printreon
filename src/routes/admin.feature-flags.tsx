import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminUI";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/feature-flags")({ component: Flags });

function Flags() {
  const [rows, setRows] = useState<any[]>([]);

  const refresh = async () => {
    const { data } = await supabase.from("feature_flags").select("*").order("key");
    setRows(data ?? []);
  };
  useEffect(() => { refresh(); }, []);

  const toggle = async (key: string, enabled: boolean) => {
    await supabase.from("feature_flags").update({ enabled }).eq("key", key);
    await supabase.from("admin_activity_log").insert({ action: `flag.${enabled ? "enabled" : "disabled"}`, target_type: "feature_flag", metadata: { key } });
    toast.success(`${key} ${enabled ? "on" : "off"}`);
    refresh();
  };

  return (
    <div className="p-8">
      <PageHeader title="Feature Flags" subtitle="Toggle platform capabilities." />
      {rows.length === 0 ? (
        <EmptyState title="No feature flags configured." />
      ) : (
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {rows.map((f) => (
            <div key={f.key} className="flex items-center justify-between p-4">
              <div>
                <div className="font-semibold">{f.name || f.key}</div>
                <div className="text-xs text-ink-soft font-mono">{f.key}</div>
                {f.description && <div className="text-xs text-ink-soft mt-1">{f.description}</div>}
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={!!f.enabled} onChange={(e) => toggle(f.key, e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:bg-primary relative transition">
                  <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background transition ${f.enabled ? "translate-x-5" : ""}`} />
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
