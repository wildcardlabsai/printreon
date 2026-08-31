import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContactMessage } from "@/functions/inbox.functions";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Printreon" }, { name: "description", content: "Contact the Printreon team." }] }),
  component: ContactPage,
});

function ContactPage() {
  const { user } = useAuth();
  const sendContact = useServerFn(submitContactMessage);
  const [form, setForm] = useState({ email: user?.email ?? "", subject: "", body: "", category: "general" });
  const [sending, setSending] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await sendContact({ data: { ...form, userId: user?.id ?? null } });
    } catch (e: any) {
      setSending(false);
      toast.error(e?.message ?? "Could not send your message — please try again.");
      return;
    }
    setSending(false);
    toast.success("Message sent — we'll be in touch.");
    setForm({ ...form, subject: "", body: "" });
  };
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold text-ink">Contact us</h1>
        <p className="mt-3 text-ink-soft">Questions, partnerships, support — we read everything.</p>
        <form onSubmit={onSubmit} className="card-soft mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium text-ink">Your email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink">
              <option value="general">General</option>
              <option value="support">Support</option>
              <option value="creator">Creator question</option>
              <option value="partnership">Partnership</option>
              <option value="press">Press</option>
              <option value="legal">Legal / DMCA</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Subject</label>
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink" />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Message</label>
            <textarea required rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink" />
          </div>
          <button disabled={sending} className="btn-primary">{sending ? "Sending..." : "Send message"}</button>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
