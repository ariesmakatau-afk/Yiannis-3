-- supabase-schema.sql
--
-- RUN THIS ONCE, in Supabase → SQL Editor → New query → paste → Run.
--
-- Two tables. Orders are kept permanently as the sales record; site_content
-- stores the one editable photo path.

-- ---------------------------------------------------------------------------
-- Orders: today's pickup orders, awaiting the end-of-day digest
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  customer_name text        not null,
  phone         text        not null,
  pickup_time   text        not null,
  email         text,
  order_notes   text,
  items         jsonb       not null,
  -- new → accepted → collected, or rejected at any point
  status        text        not null default 'new',
  wait_minutes  int,
  -- Set when the weekly digest has reported this order. Orders are never
  -- deleted — this only marks them as "already emailed".
  archived_at   timestamptz,
  constraint orders_status_check
    check (status in ('new', 'accepted', 'rejected', 'collected'))
);

create index if not exists orders_created_at_idx on orders (created_at desc);
create index if not exists orders_status_idx on orders (status);
-- The weekly digest looks for un-archived rows, so index that lookup.
create index if not exists orders_archived_idx on orders (archived_at)
  where archived_at is null;

-- ---------------------------------------------------------------------------
-- Site content: the handful of things the owner edits from /admin
-- ---------------------------------------------------------------------------
create table if not exists site_content (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

insert into site_content (key, value)
values ('team_photo_url', null)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Both tables are locked down. The site only ever reaches them from server
-- code using the service_role key, which bypasses RLS. Enabling RLS with no
-- permissive policy means a leaked anon key still reads nothing.

alter table orders enable row level security;
alter table site_content enable row level security;

-- ---------------------------------------------------------------------------
-- Storage bucket for the uploaded photo
-- ---------------------------------------------------------------------------
-- Create this in Supabase → Storage → New bucket:
--   Name:   media
--   Public: YES  (the photo is displayed on a public web page)
--
-- Uploads only ever happen server-side with the service_role key, so a public
-- bucket is read-only to the world.


-- ---------------------------------------------------------------------------
-- MIGRATION — only if you already ran an earlier version of this file
-- ---------------------------------------------------------------------------
-- Safe to run twice; does nothing if the column already exists.
--
--   alter table orders add column if not exists archived_at timestamptz;
--   create index if not exists orders_archived_idx on orders (archived_at)
--     where archived_at is null;

-- ---------------------------------------------------------------------------
-- Customer wall photos
-- ---------------------------------------------------------------------------
-- Stored as one JSON array in site_content rather than its own table: it's a
-- handful of rows, always read together, and never queried individually.
insert into site_content (key, value)
values ('parea_photos', '[]')
on conflict (key) do nothing;
