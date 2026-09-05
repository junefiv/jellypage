create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique,
  display_name text,
  avatar_url text,
  default_match_public boolean not null default true,
  created_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-z0-9_]{3,20}$')
);

create table public.user_counters (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  take_seq integer not null default 0
);

create table public.takes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  seq integer not null,
  captured_at timestamptz not null,
  city text,
  palette jsonb not null default '[]'::jsonb,
  palette_vec extensions.vector(15),
  original_path text,
  blur_path text,
  match_public boolean not null default true,
  face_hold boolean not null default false,
  source text not null default 'capture',
  status text not null default 'processing',
  match_status text not null default 'idle',
  created_at timestamptz not null default now(),
  unique (owner_id, seq),
  constraint takes_source_check check (source in ('capture', 'library', 'palette_copy', 'raw')),
  constraint takes_status_check check (status in ('ready', 'processing', 'failed', 'deleted')),
  constraint takes_match_status_check check (match_status in ('idle', 'pending', 'ready', 'empty', 'failed'))
);

create index takes_owner_created_idx on public.takes (owner_id, created_at desc);
create index takes_public_created_idx on public.takes (status, match_public, created_at desc);
create index takes_palette_vec_l2 on public.takes using hnsw (palette_vec extensions.vector_l2_ops);

create table public.take_matches (
  id uuid primary key default gen_random_uuid(),
  source_take_id uuid not null references public.takes (id) on delete cascade,
  target_take_id uuid not null references public.takes (id) on delete cascade,
  band text not null,
  rank integer not null,
  score double precision not null,
  delta double precision not null,
  unique (source_take_id, rank),
  unique (source_take_id, target_take_id),
  constraint take_matches_band_check check (band in ('open', 'close')),
  constraint take_matches_rank_check check (rank between 1 and 5)
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

create table public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  opened_by uuid not null references public.profiles (id),
  opened_at timestamptz not null default now(),
  unique (user_a, user_b),
  constraint dm_threads_ordered check (user_a < user_b)
);

create table public.dm_unlocks (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null references public.profiles (id) on delete cascade,
  peer_id uuid not null references public.profiles (id) on delete cascade,
  amount_krw integer not null default 500,
  store text not null,
  product_id text not null default 'dm_open_500',
  store_tx_id text unique,
  status text not null,
  created_at timestamptz not null default now(),
  constraint dm_unlocks_store_check check (store in ('apple', 'google')),
  constraint dm_unlocks_status_check check (status in ('pending', 'paid', 'refunded', 'failed')),
  constraint dm_unlocks_no_self check (payer_id <> peer_id)
);

create unique index dm_unlocks_paid_pair
  on public.dm_unlocks (payer_id, peer_id)
  where status = 'paid';

create table public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null default '',
  attached_take_id uuid references public.takes (id) on delete set null,
  created_at timestamptz not null default now()
);

create index dm_messages_thread_created_idx on public.dm_messages (thread_id, created_at desc);

create table public.iap_events (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  store_tx_id text not null unique,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz
);

create or replace view public.takes_public as
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
    or (
      not exists (
        select 1
        from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = t.owner_id)
           or (b.blocker_id = t.owner_id and b.blocked_id = auth.uid())
      )
    )
  );
