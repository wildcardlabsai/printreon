create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;