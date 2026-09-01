drop policy if exists "Followers viewable by all" on public.followers;
create policy "Followers viewable by self creator or admin"
  on public.followers for select to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.creator_profiles cp where cp.id = followers.creator_id and cp.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists "Reactions viewable" on public.reactions;
create policy "Reactions viewable by self or admin"
  on public.reactions for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));