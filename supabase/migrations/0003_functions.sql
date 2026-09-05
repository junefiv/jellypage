create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.next_take_seq()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH';
  end if;

  insert into public.user_counters (user_id, take_seq)
  values (auth.uid(), 1)
  on conflict (user_id)
  do update set take_seq = public.user_counters.take_seq + 1
  returning take_seq into n;

  return n;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_handle text;
  suffix text;
begin
  for i in 1..8 loop
    suffix := substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6);
    new_handle := 'user' || suffix;
    begin
      insert into public.profiles (id, handle, display_name)
      values (
        new.id,
        new_handle,
        coalesce(new.raw_user_meta_data ->> 'full_name', new_handle)
      );
      insert into public.user_counters (user_id, take_seq) values (new.id, 0);
      return new;
    exception
      when unique_violation then
        continue;
    end;
  end loop;

  raise exception 'HANDLE';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.match_take_candidates(p_take_id uuid, p_limit integer default 50)
returns table (
  id uuid,
  owner_id uuid,
  palette jsonb,
  l2 double precision
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  src public.takes;
begin
  select * into src
  from public.takes
  where public.takes.id = p_take_id
    and status = 'ready'
    and palette_vec is not null;

  if src.id is null then
    return;
  end if;

  return query
  select
    t.id,
    t.owner_id,
    t.palette,
    (t.palette_vec <-> src.palette_vec)::double precision as l2
  from public.takes t
  where t.id <> src.id
    and t.owner_id <> src.owner_id
    and t.status = 'ready'
    and t.match_public = true
    and t.palette_vec is not null
    and t.source <> 'raw'
    and t.created_at >= now() - interval '90 days'
    and not public.is_blocked(src.owner_id, t.owner_id)
  order by t.palette_vec <-> src.palette_vec
  limit greatest(p_limit, 1);
end;
$$;

create or replace function public.can_send(p_peer_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  thread_id uuid;
  peer_sent boolean := false;
  unlocked boolean := false;
  refunded boolean := false;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'reason', 'AUTH');
  end if;
  if me = p_peer_id then
    return jsonb_build_object('ok', false, 'reason', 'SELF');
  end if;
  if public.is_blocked(me, p_peer_id) then
    return jsonb_build_object('ok', false, 'reason', 'blocked');
  end if;
  if not exists (
    select 1 from public.follows
    where follower_id = me and followee_id = p_peer_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'no_follow');
  end if;

  if me < p_peer_id then
    a := me;
    b := p_peer_id;
  else
    a := p_peer_id;
    b := me;
  end if;

  select id into thread_id
  from public.dm_threads
  where user_a = a and user_b = b;

  if thread_id is not null then
    select exists (
      select 1 from public.dm_messages
      where dm_messages.thread_id = thread_id
        and sender_id = p_peer_id
    ) into peer_sent;
  end if;

  select exists (
    select 1 from public.dm_unlocks
    where payer_id = me and peer_id = p_peer_id and status = 'paid'
  ) into unlocked;

  select exists (
    select 1 from public.dm_unlocks
    where payer_id = me and peer_id = p_peer_id and status = 'refunded'
  ) into refunded;

  if peer_sent or unlocked then
    return jsonb_build_object('ok', true, 'reason', 'ok', 'thread_id', thread_id);
  end if;

  if refunded then
    return jsonb_build_object('ok', false, 'reason', 'refunded', 'thread_id', thread_id);
  end if;

  return jsonb_build_object('ok', false, 'reason', 'needs_unlock', 'thread_id', thread_id);
end;
$$;

create or replace function public.send_dm(
  p_peer_id uuid,
  p_body text,
  p_attached_take_id uuid default null
)
returns public.dm_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  gate jsonb;
  a uuid;
  b uuid;
  tid uuid;
  msg public.dm_messages;
begin
  gate := public.can_send(p_peer_id);
  if (gate ->> 'ok') <> 'true' then
    raise exception '%', gate ->> 'reason';
  end if;

  if me < p_peer_id then
    a := me;
    b := p_peer_id;
  else
    a := p_peer_id;
    b := me;
  end if;

  insert into public.dm_threads (user_a, user_b, opened_by)
  values (a, b, me)
  on conflict (user_a, user_b) do update set opened_by = public.dm_threads.opened_by
  returning id into tid;

  if p_attached_take_id is not null then
    if not exists (
      select 1 from public.takes
      where id = p_attached_take_id
        and owner_id = me
        and status <> 'deleted'
    ) then
      raise exception 'TAKE';
    end if;
  end if;

  insert into public.dm_messages (thread_id, sender_id, body, attached_take_id)
  values (tid, me, coalesce(p_body, ''), p_attached_take_id)
  returning * into msg;

  return msg;
end;
$$;

create or replace function public.open_or_get_thread(p_peer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  tid uuid;
begin
  if me is null or me = p_peer_id then
    raise exception 'AUTH';
  end if;
  if public.is_blocked(me, p_peer_id) then
    raise exception 'blocked';
  end if;
  if not exists (
    select 1 from public.follows
    where follower_id = me and followee_id = p_peer_id
  ) then
    raise exception 'no_follow';
  end if;

  if me < p_peer_id then
    a := me;
    b := p_peer_id;
  else
    a := p_peer_id;
    b := me;
  end if;

  insert into public.dm_threads (user_a, user_b, opened_by)
  values (a, b, me)
  on conflict (user_a, user_b) do update set opened_by = public.dm_threads.opened_by
  returning id into tid;

  return tid;
end;
$$;

create or replace function public.delete_take(p_take_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH';
  end if;

  update public.takes
  set
    status = 'deleted',
    match_public = false,
    match_status = 'idle',
    original_path = null,
    blur_path = null
  where id = p_take_id
    and owner_id = auth.uid();

  delete from public.take_matches
  where source_take_id = p_take_id
     or target_take_id = p_take_id;
end;
$$;

create or replace function public.copy_palette(p_take_id uuid)
returns public.takes
language plpgsql
security definer
set search_path = public
as $$
declare
  src public.takes_public;
  seq integer;
  created public.takes;
begin
  if auth.uid() is null then
    raise exception 'AUTH';
  end if;

  select * into src
  from public.takes_public
  where id = p_take_id;

  if src.id is null then
    raise exception 'TAKE';
  end if;

  seq := public.next_take_seq();

  insert into public.takes (
    owner_id,
    seq,
    captured_at,
    city,
    palette,
    palette_vec,
    original_path,
    blur_path,
    match_public,
    face_hold,
    source,
    status,
    match_status
  )
  select
    auth.uid(),
    seq,
    now(),
    null,
    t.palette,
    t.palette_vec,
    null,
    null,
    true,
    false,
    'palette_copy',
    'ready',
    'pending'
  from public.takes t
  where t.id = p_take_id
  returning * into created;

  return created;
end;
$$;

create or replace function public.block_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or me = p_blocked_id then
    raise exception 'AUTH';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (me, p_blocked_id)
  on conflict do nothing;

  delete from public.follows
  where (follower_id = me and followee_id = p_blocked_id)
     or (follower_id = p_blocked_id and followee_id = me);

  delete from public.take_matches tm
  using public.takes src, public.takes tgt
  where tm.source_take_id = src.id
    and tm.target_take_id = tgt.id
    and (
      (src.owner_id = me and tgt.owner_id = p_blocked_id)
      or (src.owner_id = p_blocked_id and tgt.owner_id = me)
    );
end;
$$;
