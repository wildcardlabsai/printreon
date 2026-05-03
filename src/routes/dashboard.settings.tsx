import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { Save, Upload, Image as ImageIcon, Globe, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { creator, refresh } = useCreatorProfile();

  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (creator) setForm(creator);
  }, [creator]);

  if (!creator || !user) return null;

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    const payload = {
      display_name: form.display_name,
      slug: form.slug,
      short_intro: form.short_intro || null,
      bio: form.bio || null,
      website_url: form.website_url || null,
      instagram_url: form.instagram_url || null,
      youtube_url: form.youtube_url || null,
      tiktok_url: form.tiktok_url || null,
      printables_url: form.printables_url || null,
      makerworld_url: form.makerworld_url || null,
      cults_url: form.cults_url || null,
    };
    const { error } = await supabase.from("creator_profiles").update(payload).eq("id", creator.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    refresh();
  };

  const togglePublish = async () => {
    const { error } = await supabase.from("creator_profiles").update({ is_published: !creator.is_published }).eq("id", creator.id);
    if (error) return toast.error(error.message);
    toast.success(creator.is_published ? "Unpublished" : "Your page is live!");
    refresh();
  };

  const uploadImage = async (bucket: "avatars" | "banners", file: File, field: "profile_image_url" | "banner_image_url") => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${creator.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const { error } = await supabase.from("creator_profiles").update({ [field]: pub.publicUrl }).eq("id", creator.id);
    if (error) return toast.error(error.message);
    toast.success("Image updated");
    refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Profile</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Display name"><input value={form.display_name ?? ""} onChange={(e) => update("display_name", e.target.value)} className={inp} /></Field>
            <Field label="URL slug"><input value={form.slug ?? ""} onChange={(e) => update("slug", e.target.value)} className={inp} /></Field>
          </div>
          <Field label="Short intro"><input value={form.short_intro ?? ""} onChange={(e) => update("short_intro", e.target.value)} maxLength={140} className={inp} /></Field>
          <Field label="Bio"><textarea value={form.bio ?? ""} onChange={(e) => update("bio", e.target.value)} rows={5} className={inp} /></Field>
        </div>

        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Links</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Website"><input value={form.website_url ?? ""} onChange={(e) => update("website_url", e.target.value)} className={inp} /></Field>
            <Field label="Instagram"><input value={form.instagram_url ?? ""} onChange={(e) => update("instagram_url", e.target.value)} className={inp} /></Field>
            <Field label="YouTube"><input value={form.youtube_url ?? ""} onChange={(e) => update("youtube_url", e.target.value)} className={inp} /></Field>
            <Field label="TikTok"><input value={form.tiktok_url ?? ""} onChange={(e) => update("tiktok_url", e.target.value)} className={inp} /></Field>
            <Field label="Printables"><input value={form.printables_url ?? ""} onChange={(e) => update("printables_url", e.target.value)} className={inp} /></Field>
            <Field label="MakerWorld"><input value={form.makerworld_url ?? ""} onChange={(e) => update("makerworld_url", e.target.value)} className={inp} /></Field>
            <Field label="Cults3D"><input value={form.cults_url ?? ""} onChange={(e) => update("cults_url", e.target.value)} className={inp} /></Field>
          </div>
        </div>

        <button onClick={save} className="btn-primary"><Save className="mr-2 h-4 w-4" /> Save changes</button>
      </div>

      <div className="space-y-6">
        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Publication</h2>
          <p className="mt-1 text-sm text-ink-soft">{creator.is_published ? "Your page is visible to the public." : "Your page is hidden from the public."}</p>
          <button onClick={togglePublish} className="btn-primary mt-3 w-full">
            {creator.is_published ? <><EyeOff className="mr-2 h-4 w-4" />Unpublish</> : <><Eye className="mr-2 h-4 w-4" />Publish page</>}
          </button>
        </div>

        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Avatar</h2>
          {creator.profile_image_url && <img src={creator.profile_image_url} className="mt-3 h-20 w-20 rounded-full object-cover" alt="" />}
          <UploadInput label="Replace avatar" onPick={(f) => uploadImage("avatars", f, "profile_image_url")} accept="image/*" />
        </div>

        <div className="card-soft">
          <h2 className="text-lg font-bold text-ink">Banner</h2>
          {creator.banner_image_url ? (
            <img src={creator.banner_image_url} className="mt-3 aspect-[5/1] w-full rounded-lg object-cover" alt="" />
          ) : (
            <div className="mt-3 aspect-[5/1] w-full rounded-lg bg-secondary flex items-center justify-center text-ink-soft"><ImageIcon className="h-6 w-6" /></div>
          )}
          <UploadInput label="Replace banner" onPick={(f) => uploadImage("banners", f, "banner_image_url")} accept="image/*" />
        </div>
      </div>
    </div>
  );
}

function UploadInput({ label, onPick, accept }: { label: string; onPick: (f: File) => void; accept: string }) {
  return (
    <label className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-ink hover:border-primary">
      <Upload className="h-4 w-4" /> {label}
      <input
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
    </label>
  );
}

const inp = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="text-xs font-semibold text-ink">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
