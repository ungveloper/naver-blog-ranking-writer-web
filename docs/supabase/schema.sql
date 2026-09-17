-- Draft only. Do not apply yet.
-- This file freezes the intended relational direction before Supabase setup.

create type public.hospital_member_role as enum ('OWNER', 'EDITOR', 'VIEWER');
create type public.fact_status as enum ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW', 'UNKNOWN', 'NOT_APPLICABLE');
create type public.keyword_type as enum ('PRIMARY', 'SECONDARY');
create type public.device_type as enum ('MOBILE', 'DESKTOP');

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hospital_members (
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  user_id text not null,
  role public.hospital_member_role not null default 'VIEWER',
  created_at timestamptz not null default now(),
  primary key (hospital_id, user_id)
);

create table if not exists public.hospital_sources (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  source_type text not null,
  url text,
  title text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.hospital_facts (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  fact_key text not null,
  value jsonb not null,
  status public.fact_status not null default 'UNVERIFIED',
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  title text not null,
  device_preference public.device_type not null default 'MOBILE',
  status text not null default 'DRAFT',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_keywords (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  keyword text not null,
  keyword_type public.keyword_type not null,
  created_at timestamptz not null default now()
);

create unique index if not exists one_primary_keyword_per_project
on public.project_keywords(project_id)
where keyword_type = 'PRIMARY';

create table if not exists public.serp_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  device public.device_type not null,
  captured_at timestamptz not null default now(),
  context jsonb not null default '{}'::jsonb
);

create table if not exists public.serp_results (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.serp_snapshots(id) on delete cascade,
  rank integer,
  title text,
  url text not null,
  normalized_url text,
  included boolean not null default true,
  exclusion_reason text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  serp_result_id uuid references public.serp_results(id) on delete set null,
  source_url text not null,
  canonical_url text,
  title text,
  content_text text,
  content_hash text,
  published_at timestamptz,
  captured_at timestamptz not null default now(),
  parser_version text,
  structural_features jsonb not null default '{}'::jsonb,
  image_metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  feature_extractor_version text not null,
  scoring_version text not null,
  prompt_version text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_rounds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  round_number integer not null,
  input_context jsonb not null default '{}'::jsonb,
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  result jsonb not null default '{}'::jsonb,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_blueprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null,
  stage text not null,
  title_candidates jsonb not null default '[]'::jsonb,
  content_text text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(project_id, version)
);
