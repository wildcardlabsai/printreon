import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/** Flip to false to remove the banner from every page. */
const ACTIVE = true;

/** Bump the version suffix when the message changes so dismissals reset. */
const DISMISS_KEY = "printreon-status-banner-stripe-connect-v1";

const MESSAGE =
  "Some creators are seeing an intermittent error when connecting a payout account. Stripe are reviewing it and we expect it resolved shortly. Everything else works as normal.";

export function StatusBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!ACTIVE) return;
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!ACTIVE || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="border-b border-amber-300/70 bg-amber-50 text-amber-900">
      <div className="container-page flex items-start gap-3 py-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed sm:text-sm">
          <span className="font-semibold">Known issue:</span> {MESSAGE}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss notice"
          className="ml-auto shrink-0 rounded p-1 text-amber-900/70 transition hover:bg-amber-100 hover:text-amber-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
