-- =============================================================================
-- Folio — initial schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Every table is protected by row level security keyed on auth.uid().
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user, created automatically on sign up
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  headline     text,
  avatar_url   text,
  locale       text not null default 'en',
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Mirror new auth users into profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- resumes — the CV documents themselves; `data` holds the full CVData JSON
-- -----------------------------------------------------------------------------

create table if not exists public.resumes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null default 'Untitled CV',
  data          jsonb not null default '{}'::jsonb,
  ats_score     smallint check (ats_score between 0 and 100),
  target_role   text not null default '',
  is_archived   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists resumes_user_updated_idx
  on public.resumes (user_id, updated_at desc);
create index if not exists resumes_user_active_idx
  on public.resumes (user_id) where is_archived = false;

alter table public.resumes enable row level security;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists resumes_set_updated_at on public.resumes;
create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- resume_versions — restore points, capped at the newest 30 per resume
-- -----------------------------------------------------------------------------

create table if not exists public.resume_versions (
  id          uuid primary key default gen_random_uuid(),
  resume_id   uuid not null references public.resumes (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  version     integer not null,
  label       text not null default '',
  data        jsonb not null,
  ats_score   smallint check (ats_score between 0 and 100),
  created_at  timestamptz not null default now(),
  unique (resume_id, version)
);

create index if not exists resume_versions_resume_idx
  on public.resume_versions (resume_id, version desc);

alter table public.resume_versions enable row level security;

drop policy if exists "resume_versions_select_own" on public.resume_versions;
create policy "resume_versions_select_own" on public.resume_versions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "resume_versions_insert_own" on public.resume_versions;
create policy "resume_versions_insert_own" on public.resume_versions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "resume_versions_delete_own" on public.resume_versions;
create policy "resume_versions_delete_own" on public.resume_versions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Auto-number versions per resume.
create or replace function public.assign_resume_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.version is null or new.version = 0 then
    select coalesce(max(v.version), 0) + 1
      into new.version
      from public.resume_versions v
     where v.resume_id = new.resume_id;
  end if;
  return new;
end;
$$;

drop trigger if exists resume_versions_assign_version on public.resume_versions;
create trigger resume_versions_assign_version
  before insert on public.resume_versions
  for each row execute function public.assign_resume_version();

-- Keep history bounded so a chatty autosave can't grow unbounded.
create or replace function public.prune_resume_versions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.resume_versions
   where id in (
     select id from public.resume_versions
      where resume_id = new.resume_id
      order by version desc
      offset 30
   );
  return null;
end;
$$;

drop trigger if exists resume_versions_prune on public.resume_versions;
create trigger resume_versions_prune
  after insert on public.resume_versions
  for each row execute function public.prune_resume_versions();

-- -----------------------------------------------------------------------------
-- cover_letters
-- -----------------------------------------------------------------------------

create table if not exists public.cover_letters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  resume_id   uuid references public.resumes (id) on delete set null,
  title       text not null default 'Untitled Cover Letter',
  company     text not null default '',
  role        text not null default '',
  tone        text not null default 'professional',
  body        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cover_letters_user_updated_idx
  on public.cover_letters (user_id, updated_at desc);

alter table public.cover_letters enable row level security;

drop policy if exists "cover_letters_select_own" on public.cover_letters;
create policy "cover_letters_select_own" on public.cover_letters
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "cover_letters_insert_own" on public.cover_letters;
create policy "cover_letters_insert_own" on public.cover_letters
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "cover_letters_update_own" on public.cover_letters;
create policy "cover_letters_update_own" on public.cover_letters
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "cover_letters_delete_own" on public.cover_letters;
create policy "cover_letters_delete_own" on public.cover_letters
  for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists cover_letters_set_updated_at on public.cover_letters;
create trigger cover_letters_set_updated_at
  before update on public.cover_letters
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- job_targets — saved job descriptions and their keyword match results
-- -----------------------------------------------------------------------------

create table if not exists public.job_targets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  resume_id         uuid references public.resumes (id) on delete cascade,
  company           text not null default '',
  role              text not null default '',
  job_description   text not null default '',
  match_score       smallint check (match_score between 0 and 100),
  matched_keywords  jsonb not null default '[]'::jsonb,
  missing_keywords  jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists job_targets_user_created_idx
  on public.job_targets (user_id, created_at desc);
create index if not exists job_targets_resume_idx
  on public.job_targets (resume_id);

alter table public.job_targets enable row level security;

drop policy if exists "job_targets_select_own" on public.job_targets;
create policy "job_targets_select_own" on public.job_targets
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "job_targets_insert_own" on public.job_targets;
create policy "job_targets_insert_own" on public.job_targets
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "job_targets_update_own" on public.job_targets;
create policy "job_targets_update_own" on public.job_targets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "job_targets_delete_own" on public.job_targets;
create policy "job_targets_delete_own" on public.job_targets
  for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists job_targets_set_updated_at on public.job_targets;
create trigger job_targets_set_updated_at
  before update on public.job_targets
  for each row execute function public.set_updated_at();
