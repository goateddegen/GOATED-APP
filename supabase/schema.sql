-- =============================================================================
-- GOATED — Supabase schema
-- -----------------------------------------------------------------------------
-- Run once in Supabase Studio → SQL Editor → New query → paste → Run.
-- Creates every table src/lib/supabase.js reads or writes, with row-level
-- security on by default so a leaked anon key can't drain the database.
--
-- Tables referenced by the app today:
--   profiles, waitlist, leads, deals, market_data, transactions, commissions,
--   user_settings, analytics_events
-- =============================================================================

-- ─── Profiles — the OAuth login mirror ──────────────────────────────────────
-- Supabase already persists every signup into auth.users, but that table can't
-- take extra columns and can't be joined against from the client. This mirrors
-- each new user into a table we own, populated by a trigger so it stays in sync
-- without any application code. Google sign-ins land here automatically.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  provider   text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_own_row" on public.profiles;
create policy "profiles_own_row"
  on public.profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- security definer so the trigger can write regardless of the caller's RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this trigger existed.
insert into public.profiles (id, email, full_name, avatar_url, provider)
select u.id,
       u.email,
       u.raw_user_meta_data->>'full_name',
       u.raw_user_meta_data->>'avatar_url',
       u.raw_app_meta_data->>'provider'
from auth.users u
on conflict (id) do nothing;

-- ─── Waitlist (public insert, admin read) ───────────────────────────────────
create table if not exists public.waitlist (
  id           bigint generated always as identity primary key,
  email        text not null,
  name         text,
  business_type text,
  joined_at    timestamptz not null default now(),
  unique (email)
);

alter table public.waitlist enable row level security;

-- Anyone may join the waitlist; nobody may read it back with the anon key.
drop policy if exists "waitlist_public_insert" on public.waitlist;
create policy "waitlist_public_insert"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- ─── Per-user settings (cloud sync of local preferences) ────────────────────
create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  settings   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_own_rows" on public.user_settings;
create policy "user_settings_own_rows"
  on public.user_settings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Leads (owned by the operator who sourced them) ─────────────────────────
create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  owner_id    uuid references auth.users(id) on delete cascade,
  external_id text,
  name        text,
  company     text,
  email       text,
  phone       text,
  title       text,
  industry    text,
  location    text,
  website     text,
  linkedin_url text,
  employees   int,
  revenue     bigint,
  score       int check (score between 0 and 100),
  priority    text,
  status      text default 'new',
  deal_value  numeric(12,2),
  source      text,
  tags        text[],
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  last_activity timestamptz
);

create index if not exists leads_owner_idx    on public.leads (owner_id);
create index if not exists leads_score_idx    on public.leads (score desc);
create index if not exists leads_industry_idx on public.leads (industry);
create index if not exists leads_status_idx   on public.leads (status);

alter table public.leads enable row level security;

drop policy if exists "leads_own_rows" on public.leads;
create policy "leads_own_rows"
  on public.leads for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─── Deals ──────────────────────────────────────────────────────────────────
create table if not exists public.deals (
  id         bigint generated always as identity primary key,
  owner_id   uuid references auth.users(id) on delete cascade,
  lead_id    bigint references public.leads(id) on delete set null,
  client_name text,
  stage      text default 'discovery',
  tier       text,
  setup_fee  numeric(12,2),
  retainer   numeric(12,2),
  rev_share_pct numeric(5,2),
  amount     numeric(12,2),
  closed_at  timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists deals_owner_idx on public.deals (owner_id);

alter table public.deals enable row level security;

drop policy if exists "deals_own_rows" on public.deals;
create policy "deals_own_rows"
  on public.deals for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─── Transactions ───────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id          bigint generated always as identity primary key,
  owner_id    uuid references auth.users(id) on delete cascade,
  deal_id     bigint references public.deals(id) on delete set null,
  type        text,
  amount      numeric(12,2) not null,
  currency    text not null default 'usd',
  status      text default 'pending',
  stripe_payment_intent text,
  description text,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_owner_idx on public.transactions (owner_id);

alter table public.transactions enable row level security;

drop policy if exists "transactions_own_rows" on public.transactions;
create policy "transactions_own_rows"
  on public.transactions for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─── Commissions ────────────────────────────────────────────────────────────
create table if not exists public.commissions (
  id         bigint generated always as identity primary key,
  owner_id   uuid references auth.users(id) on delete cascade,
  deal_id    bigint references public.deals(id) on delete set null,
  amount     numeric(12,2) not null,
  rate       numeric(5,4) not null default 0.13,
  paid_at    timestamptz,
  created_at timestamptz not null default now()
);

alter table public.commissions enable row level security;

drop policy if exists "commissions_own_rows" on public.commissions;
create policy "commissions_own_rows"
  on public.commissions for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─── Market data (shared, read-only to clients) ─────────────────────────────
create table if not exists public.market_data (
  id         bigint generated always as identity primary key,
  symbol     text not null,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

create unique index if not exists market_data_symbol_idx on public.market_data (symbol);

alter table public.market_data enable row level security;

drop policy if exists "market_data_read" on public.market_data;
create policy "market_data_read"
  on public.market_data for select
  to anon, authenticated
  using (true);
-- Writes are service-role only (no policy = denied for anon/authenticated).

-- ─── Analytics events (write-only firehose) ─────────────────────────────────
create table if not exists public.analytics_events (
  id         bigint generated always as identity primary key,
  event      text not null,
  properties jsonb default '{}'::jsonb,
  page       text,
  user_agent text,
  user_id    uuid references auth.users(id) on delete set null,
  timestamp  timestamptz not null default now()
);

create index if not exists analytics_events_event_idx on public.analytics_events (event, timestamp desc);

alter table public.analytics_events enable row level security;

drop policy if exists "analytics_public_insert" on public.analytics_events;
create policy "analytics_public_insert"
  on public.analytics_events for insert
  to anon, authenticated
  with check (true);
-- No select policy: events go in, only the service role reads them back.

-- ─── Realtime ───────────────────────────────────────────────────────────────
-- src/lib/supabase.js subscribes to these three tables.
--
-- `alter publication ... add table` throws if the table is already a member, so
-- guard each one — otherwise re-running this file fails at the last step, after
-- everything else has already succeeded.
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='leads') then
    alter publication supabase_realtime add table public.leads;
  end if;

  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='deals') then
    alter publication supabase_realtime add table public.deals;
  end if;

  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='market_data') then
    alter publication supabase_realtime add table public.market_data;
  end if;
end $$;
