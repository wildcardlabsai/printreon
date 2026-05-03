import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCreatorProfile } from "@/lib/use-creator-profile";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/messages")({
  head: () => ({ meta: [{ title: "Messages — Creator Studio" }] }),
  component: CreatorMessages,
});

function CreatorMessages() {
  const { user } = useAuth();
  const { creator } = useCreatorProfile();
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!creator) return;
    supabase.from("dm_threads").select("*, profiles!dm_threads_member_user_id_fkey(full_name,email)").eq("creator_id", creator.id).order("last_message_at", { ascending: false })
      .then(({ data }) => setThreads(data ?? []));
  }, [creator]);

  useEffect(() => {
    if (!active) return;
    supabase.from("dm_messages").select("*").eq("thread_id", active).order("created_at").then(({ data }) => setMessages(data ?? []));
  }, [active]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !active || !body.trim()) return;
    const { error } = await supabase.from("dm_messages").insert({ thread_id: active, sender_user_id: user.id, body });
    if (error) return toast.error(error.message);
    setBody("");
    const { data } = await supabase.from("dm_messages").select("*").eq("thread_id", active).order("created_at");
    setMessages(data ?? []);
  };

  if (!creator) return null;
  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="card-soft">
        <h2 className="mb-3 font-bold text-ink">Member conversations</h2>
        {threads.length === 0 ? <p className="text-sm text-ink-soft">No messages yet.</p> :
          threads.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`block w-full rounded-md p-2 text-left text-sm ${active === t.id ? "bg-accent text-primary" : "text-ink hover:bg-secondary"}`}>
              Member
            </button>
          ))}
      </aside>
      <main className="card-soft min-h-[400px]">
        {!active ? <p className="text-ink-soft">Select a conversation.</p> : (
          <>
            <div className="space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`max-w-md rounded-lg p-2 text-sm ${m.sender_user_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-ink"}`}>{m.body}</div>
              ))}
            </div>
            <form onSubmit={send} className="mt-4 flex gap-2">
              <input value={body} onChange={(e) => setBody(e.target.value)} className="flex-1 rounded-md border border-border bg-background p-2" placeholder="Reply..." />
              <button className="btn-primary">Send</button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
