drop view if exists public.takes_public;

create view public.takes_public
with (security_invoker = true)
as
select
  t.id,
  t.owner_id,
  t.seq,
  t.captured_at,
  t.city,
  t.palette,
  t.blur_path,
  t.match_public,
  t.status,
  t.created_at,
  p.handle
from public.takes t
join public.profiles p on p.id = t.owner_id
where t.match_public = true
  and t.status = 'ready'
  and (
    auth.uid() is null
    or not public.is_blocked(auth.uid(), t.owner_id)
  );

grant select on public.takes_public to authenticated, anon;

create policy takes_public_read on public.takes
  for select to authenticated
  using (
    match_public = true
    and status = 'ready'
    and not public.is_blocked(auth.uid(), owner_id)
  );

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.match_take_candidates(uuid, integer) from public, anon, authenticated;
grant execute on function public.match_take_candidates(uuid, integer) to service_role;

revoke all on function public.is_blocked(uuid, uuid) from public, anon;
revoke execute on function public.next_take_seq() from public, anon;
revoke execute on function public.can_send(uuid) from public, anon;
revoke execute on function public.send_dm(uuid, text, uuid) from public, anon;
revoke execute on function public.open_or_get_thread(uuid) from public, anon;
revoke execute on function public.delete_take(uuid) from public, anon;
revoke execute on function public.copy_palette(uuid) from public, anon;
revoke execute on function public.block_user(uuid) from public, anon;
