import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteChrome";
import { MemberNav } from "@/components/MemberNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/me/print-log")({
  head: () => ({ meta: [{ title: "Print log — MakerMind Club" }] }),
  component: PrintLogPage,
});

function PrintLogPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [form, setForm] = useState({ file_id: "", rating: 5, notes: "", photo: null as File | null });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("print_log").select("*, creator_files(title)").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
    const { data: dl } = await supabase.from("downloads").select("file_id, creator_files(id,title,creator_id)").eq("user_id", user.id).limit(50);
    setFiles((dl ?? []).filter((d: any) => d.creator_files));
  };
  useEffect(() => { load(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.file_id) return;
    let photoUrl: string | null = null;
    if (form.photo) {
      const path = `${user.id}/${Date.now()}_${form.photo.name}`;
      const { error } = await supabase.storage.from("print-log").upload(path, form.photo);
      if (error) return toast.error(error.message);
      photoUrl = supabase.storage.from("print-log").getPublicUrl(path).data.publicUrl;
    }
    const file = files.find((f) => f.creator_files?.id === form.file_id);
    const { error } = await supabase.from("print_log").insert({
      user_id: user.id, file_id: form.file_id, creator_id: file?.creator_files?.creator_id,
      rating: form.rating, notes: form.notes, photo_url: photoUrl,
    });
    if (error) return toast.error(error.message);
    toast.success("Print logged!");
    setForm({ file_id: "", rating: 5, notes: "", photo: null });
    load();
  };

  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <div className="container-page py-8">
        <MemberNav />
        <h1 className="text-2xl font-bold text-ink">Print log</h1>
        <form onSubmit={submit} className="card-soft mt-4 space-y-3">
          <select required value={form.file_id} onChange={(e) => setForm({ ...form, file_id: e.target.value })} className="w-full rounded-md border border-border bg-background p-2">
            <option value="">Select a file you've downloaded</option>
            {files.map((d) => <option key={d.creator_files.id} value={d.creator_files.id}>{d.creator_files.title}</option>)}
          </select>
          <input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: +e.target.value })} className="w-full rounded-md border border-border bg-background p-2" />
          <textarea placeholder="Notes about your print..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" />
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] ?? null })} />
          <button className="btn-primary">Log print</button>
        </form>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {items.map((i) => (
            <div key={i.id} className="card-soft">
              {i.photo_url && <img src={i.photo_url} alt="" className="aspect-square w-full rounded-lg object-cover" />}
              <p className="mt-2 font-semibold text-ink">{i.creator_files?.title}</p>
              <p className="text-xs text-ink-soft">★ {i.rating}/5</p>
              {i.notes && <p className="mt-1 text-sm text-ink-soft">{i.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
