
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_sub_id_key ON public.subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view outbox" ON public.email_outbox FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
