import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/functions/inbox.functions";
import { Loader2, Check } from "lucide-react";

export function NewsletterSignup({
  source = "footer",
  className = "",
  heading = "Get Printreon updates",
  blurb = "New creator tools, releases and beta milestones. No spam.",
}: {
  source?: string;
  className?: string;
  heading?: string;
  blurb?: string;
}) {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setMessage("");
    try {
      const r: any = await subscribe({ data: { email: email.trim(), source } });
      setState("done");
      setMessage(r?.alreadySubscribed ? "You're already on the list." : "You're on the list — check your inbox.");
    } catch {
      setState("error");
      setMessage("Please enter a valid email and try again.");
    }
  };

  return (
    <div className={className}>
      <h3 className="text-sm font-bold text-ink">{heading}</h3>
      <p className="mt-1 text-xs text-ink-soft">{blurb}</p>
      {state === "done" ? (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-primary">
          <Check className="h-4 w-4" /> {message}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor={`newsletter-${source}`}>
            Email address
          </label>
          <input
            id={`newsletter-${source}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-ink sm:w-64"
          />
          <button disabled={state === "loading"} className="btn-primary h-10 whitespace-nowrap text-sm">
            {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
          </button>
        </form>
      )}
      {state === "error" && <p className="mt-2 text-xs text-destructive">{message}</p>}
    </div>
  );
}
