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

-- ---------------------------------------------------------------------------
-- Social media planner (/admin/social, /admin/events, /whats-on)
-- ---------------------------------------------------------------------------
-- Safe to run on an existing database: everything is "if not exists".

-- Events: specials, live music, closures, anything worth telling people
-- about. Shown on /whats-on and used when the weekly posts are written.
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text        not null,
  description text        not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text,
  image_url   text,
  -- false = internal only: used for planning posts, not listed on the site
  is_public   boolean     not null default true
);

create index if not exists events_starts_at_idx on events (starts_at);

-- One row per planned post. Drafted on Sunday, approved by the owner,
-- published on its day to each channel in `channels`.
create table if not exists social_posts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Monday of the week the post belongs to (shop time)
  week_start    date        not null,
  post_date     date        not null,
  scheduled_for timestamptz not null,
  title         text        not null default '',
  caption       text        not null,
  image_url     text,
  channels      text[]      not null default '{facebook,instagram,website}',
  event_id      uuid        references events (id) on delete set null,
  -- draft → approved → published | partial | failed, or skipped
  status        text        not null default 'draft',
  -- per-channel outcome: { "facebook": { "ok": true, "id": "...", "link": "..." }, ... }
  results       jsonb       not null default '{}',
  published_at  timestamptz,
  constraint social_posts_status_check
    check (status in ('draft', 'approved', 'published', 'partial', 'failed', 'skipped'))
);

create index if not exists social_posts_week_idx on social_posts (week_start, post_date);
create index if not exists social_posts_due_idx on social_posts (scheduled_for)
  where status = 'approved';

alter table events enable row level security;
alter table social_posts enable row level security;

-- Photos uploaded for posts live in the same public `media` bucket, under
-- social/uploads/ (uploaded in the admin) and social/imported/ (copied from
-- Facebook/Instagram so their links don't expire). No extra setup needed.
