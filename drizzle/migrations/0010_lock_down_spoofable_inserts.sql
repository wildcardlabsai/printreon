-- Notifications, audit log and referrals are written server-side with the
-- service role only; drop the open client INSERT policies.
drop policy if exists "Service insert notifications" on public.notifications;
drop policy if exists "Insert audit log" on public.audit_log;
drop policy if exists "Insert referrals" on public.referrals;

create policy "Users create own referrals"
  on public.referrals for insert to authenticated
  with check (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);

-- print-log photos: only public entries (or the owner / an admin) may be read.
drop policy if exists "Print log photos public" on storage.objects;
create policy "Print log photos follow entry privacy"
  on storage.objects for select
  using (
    bucket_id = 'print-log'
    and (
      (auth.uid())::text = (storage.foldername(name))[1]
      or public.has_role(auth.uid(), 'admin')
      or exists (
        select 1 from public.print_log pl
        where pl.is_public = true
          and pl.photo_url is not null
          and pl.photo_url like '%' || storage.objects.name
      )
    )
  );