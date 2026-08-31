import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { MessageSquarePlus } from "lucide-react";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Send feedback — Printreon" },
      { name: "description", content: "Share an idea, report a bug or tell us what would make Printreon better." },
      { property: "og:title", content: "Send feedback — Printreon" },
      { property: "og:description", content: "Share an idea, report a bug or tell us what would make Printreon better." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FeedbackPage,
});

const COOLDOWN_MS = 30_000;

function FeedbackPage() {
  const { user } = useAuth();
  const [type, setType] = useState("idea");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (Date.now() - lastSentAt < COOLDOWN_MS) {
      toast.error("Please wait a moment before sending more feedback.");
      return;
    }
    if (message.trim().length < 5) {
      toast.error("Please add a little more detail.");
      return;
    }
    setSending(true);
    const { error } = await supabase.rpc("submit_feedback", {
      payload: {
        type,
        name: name.trim(),
        email: (email || user?.email || "").trim(),
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : "",
      },
    });
    setSending(false);
    if (error) {
      toast.error(
        error.message.includes("invalid_email")
          ? "Please enter a valid email address."
          : error.message.includes("message")
            ? "Please check your message length."
            : "Something went wrong — please try again.",
      );
      return;
    }
    setLastSentAt(Date.now());
    setMessage("");
    setSent(true);
    toast.success("Thanks — feedback received.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl font-bold text-ink">Send feedback</h1>
        <p className="mt-3 text-ink-soft">
          Got an idea, spotted a bug, or want something changed? Tell us — we read every message.
        </p>

        {sent ? (
          <div className="card-soft mt-8 text-center">
            <MessageSquarePlus className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 text-lg font-bold text-ink">Thanks for the feedback</h2>
            <p className="mt-1 text-sm text-ink-soft">We've logged it and will follow up if we need more detail.</p>
            <button onClick={() => setSent(false)} className="btn-ghost mt-4">Send another</button>
          </div>
        ) : (
          <form onSubmit={submit} className="card-soft mt-8 space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">What kind of feedback?</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink"
              >
                <option value="idea">Idea / feature request</option>
                <option value="bug">Bug report</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Your name (optional)</label>
              <input
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Email</label>
              <input
                type="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Message</label>
              <textarea
                required
                rows={6}
                maxLength={4000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background p-2 text-ink"
              />
              <p className="mt-1 text-right text-xs text-ink-soft">{message.length}/4000</p>
            </div>
            {/* honeypot */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />
            <button disabled={sending} className="btn-primary">
              {sending ? "Sending…" : "Send feedback"}
            </button>
          </form>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
