alter table public.profiles enable row level security;
alter table public.user_counters enable row level security;
alter table public.takes enable row level security;
alter table public.take_matches enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_unlocks enable row level security;
alter table public.dm_messages enable row level security;
alter table public.iap_events enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy user_counters_select_own on public.user_counters
  for select to authenticated
  using (user_id = auth.uid());

create policy takes_owner_all on public.takes
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy take_matches_source_owner_select on public.take_matches
  for select to authenticated
  using (
    exists (
      select 1 from public.takes t
      where t.id = take_matches.source_take_id
        and t.owner_id = auth.uid()
    )
  );

create policy follows_select_party on public.follows
  for select to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());

create policy follows_insert_self on public.follows
  for insert to authenticated
  with check (follower_id = auth.uid());

create policy follows_delete_party on public.follows
  for delete to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());

create policy blocks_owner_all on public.blocks
  for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

create policy dm_threads_party on public.dm_threads
  for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy dm_threads_insert_party on public.dm_threads
  for insert to authenticated
  with check (auth.uid() = user_a or auth.uid() = user_b);

create policy dm_messages_party_select on public.dm_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.dm_threads th
      where th.id = dm_messages.thread_id
        and (th.user_a = auth.uid() or th.user_b = auth.uid())
    )
  );

create policy dm_unlocks_payer_select on public.dm_unlocks
  for select to authenticated
  using (payer_id = auth.uid());

grant select on public.takes_public to authenticated, anon;
grant execute on function public.next_take_seq() to authenticated;
grant execute on function public.match_take_candidates(uuid, integer) to service_role;
grant execute on function public.can_send(uuid) to authenticated;
grant execute on function public.send_dm(uuid, text, uuid) to authenticated;
grant execute on function public.open_or_get_thread(uuid) to authenticated;
grant execute on function public.delete_take(uuid) to authenticated;
grant execute on function public.copy_palette(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.is_blocked(uuid, uuid) to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.dm_messages;
exception
  when duplicate_object then null;
end $$;
