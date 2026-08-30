import { useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { useServerFn } from "@tanstack/react-start";
import { createTierCheckoutSession } from "@/functions/payments.functions";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  tierId: string;
  open: boolean;
  onClose: () => void;
}

export function SubscribeCheckoutModal({ tierId, open, onClose }: Props) {
  const startCheckout = useServerFn(createTierCheckoutSession);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setError(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const returnUrl = `${window.location.origin}/me/subscriptions?checkout=success`;
        const { clientSecret } = await startCheckout({
          data: { tierId, returnUrl, environment: getStripeEnvironment() },
        });
        if (alive) setClientSecret(clientSecret);
      } catch (e: any) {
        let msg = "Could not start checkout";
        if (e instanceof Response) {
          if (e.status === 401 || e.status === 302) {
            msg = "Please sign in again to continue checkout.";
          } else {
            try {
              const txt = await e.clone().text();
              msg = txt || `Checkout failed (${e.status})`;
            } catch { msg = `Checkout failed (${e.status})`; }
          }
        } else if (e?.message) {
          msg = e.message;
        }
        if (alive) {
          setError(msg);
          toast.error(msg);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, tierId, startCheckout]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card p-2 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-card p-2 text-ink hover:bg-secondary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        {error ? (
          <div className="p-10 text-center text-sm text-destructive">{error}</div>
        ) : !clientSecret ? (
          <div className="flex items-center justify-center p-16 text-ink-soft">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing secure checkout…
          </div>
        ) : (
          <div id="checkout" className="max-h-[80vh] overflow-y-auto rounded-xl">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret: async () => clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}
