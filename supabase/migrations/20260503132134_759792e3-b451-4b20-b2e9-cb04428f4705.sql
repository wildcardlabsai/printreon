DROP POLICY IF EXISTS "Public announcements viewable" ON public.creator_announcements;

CREATE POLICY "Public announcements viewable"
ON public.creator_announcements
FOR SELECT
USING (
  audience = 'everyone'
  OR EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.id = creator_announcements.creator_id AND cp.user_id = auth.uid())
  OR (audience = 'followers' AND EXISTS (
    SELECT 1 FROM public.followers f
    WHERE f.creator_id = creator_announcements.creator_id AND f.user_id = auth.uid()
  ))
  OR (audience = 'subscribers' AND EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.creator_id = creator_announcements.creator_id AND s.user_id = auth.uid() AND s.status = 'active'
  ))
);