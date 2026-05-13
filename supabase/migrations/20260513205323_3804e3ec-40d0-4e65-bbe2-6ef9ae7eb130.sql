
CREATE OR REPLACE FUNCTION public.submit_beta_preregistration(payload jsonb)
RETURNS TABLE(referral_code text, email text, status text, founder_pricing_eligible boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  v_email text := lower(trim(payload->>'email'));
  v_invite text := nullif(payload->>'invite_code','');
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'email_required';
  END IF;

  INSERT INTO public.beta_preregistrations (
    email, full_name, creator_name, social_url, current_platform, audience_size,
    sells_stls, sells_physical_prints, interested_in_commercial_licensing,
    biggest_frustration, reason_for_joining, source, tags,
    invite_code, referred_by, status, invited_at, founder_pricing_eligible
  ) VALUES (
    v_email,
    nullif(payload->>'full_name',''),
    nullif(payload->>'creator_name',''),
    nullif(payload->>'social_url',''),
    nullif(payload->>'current_platform',''),
    nullif(payload->>'audience_size',''),
    coalesce((payload->>'sells_stls')::boolean, false),
    coalesce((payload->>'sells_physical_prints')::boolean, false),
    coalesce((payload->>'interested_in_commercial_licensing')::boolean, false),
    nullif(payload->>'biggest_frustration',''),
    nullif(payload->>'reason_for_joining',''),
    coalesce(nullif(payload->>'source',''),'landing'),
    coalesce(payload->'tags', '[]'::jsonb),
    v_invite,
    nullif(payload->>'referred_by',''),
    CASE WHEN v_invite IS NOT NULL THEN 'invited' ELSE 'pending' END,
    CASE WHEN v_invite IS NOT NULL THEN now() ELSE NULL END,
    true
  )
  RETURNING id INTO new_id;

  RETURN QUERY
  SELECT bp.referral_code, bp.email, bp.status, bp.founder_pricing_eligible
  FROM public.beta_preregistrations bp
  WHERE bp.id = new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_beta_preregistration(jsonb) TO anon, authenticated;
