-- Per-transaction earnings ledger. Written only by the verified Stripe webhook
-- (service role). Creators read their own rows; admins read everything.
CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'sandbox',
  kind text NOT NULL DEFAULT 'payment', -- payment | refund | dispute | payout_adjustment
  status text NOT NULL DEFAULT 'succeeded', -- succeeded | failed | pending | reversed
  user_id uuid,
  creator_id uuid REFERENCES public.creator_profiles(id) ON DELETE SET NULL,
  tier_id uuid REFERENCES public.creator_tiers(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_event_id text,
  stripe_invoice_id text,
  stripe_charge_id text,
  stripe_subscription_id text,
  currency text NOT NULL DEFAULT 'usd',
  gross_amount numeric(12,2) NOT NULL DEFAULT 0,
  stripe_fee numeric(12,2) NOT NULL DEFAULT 0,
  platform_fee numeric(12,2) NOT NULL DEFAULT 0,
  net_amount numeric(12,2) NOT NULL DEFAULT 0,
  period_start timestamptz,
  period_end timestamptz,
  failure_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_events_stripe_event_key
  ON public.payment_events (stripe_event_id) WHERE stripe_event_id IS NOT NULL;
CREATE INDEX payment_events_creator_idx ON public.payment_events (creator_id, occurred_at DESC);
CREATE INDEX payment_events_user_idx ON public.payment_events (user_id, occurred_at DESC);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators read own payment events"
  ON public.payment_events FOR SELECT TO authenticated
  USING (
    creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins read all payment events"
  ON public.payment_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Dunning bookkeeping on subscriptions (additive, nullable).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_failed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comped boolean NOT NULL DEFAULT false;

-- Admin service-role writes to subscriptions already bypass RLS; add an admin
-- read policy so the memberships screen can see every row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions'
      AND policyname = 'Admins read all subscriptions'
  ) THEN
    CREATE POLICY "Admins read all subscriptions"
      ON public.subscriptions FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
