import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/legal/dmca")({
  head: () => ({ meta: [{ title: "DMCA — MakerMind Club" }, { name: "description", content: "DMCA takedown policy and form." }] }),
  component: DmcaPage,
});

function DmcaPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ email: user?.email ?? "", subject: "DMCA takedown request", body: "" });
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({ ...form, category: "dmca", user_id: user?.id ?? null });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("DMCA request submitted. We'll review within 48 hours.");
    setForm({ ...form, body: "" });
  };
  return (
    <article className="text-ink">
      <h1>DMCA Policy</h1>
      <p>MakerMind Club respects intellectual property rights. To report infringing content, complete the form below or email <a href="mailto:dmca@makermind.club">dmca@makermind.club</a>.</p>
      <p>Your notice must include: identification of the work, the URL of the infringing content on makermind.club, your contact info, a good-faith statement, an accuracy statement under penalty of perjury, and your physical or electronic signature.</p>
      <form onSubmit={submit} className="card-soft not-prose mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-ink">Your email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink" />
        </div>
        <div>
          <label className="text-sm font-medium text-ink">Details (URLs, work identification, signature)</label>
          <textarea required rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink" />
        </div>
        <button disabled={sending} className="btn-primary">{sending ? "Sending..." : "Submit DMCA notice"}</button>
      </form>
    </article>
  );
}
