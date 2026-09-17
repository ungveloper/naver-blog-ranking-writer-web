do $$
begin
  create type hospital_profile_status as enum ('DRAFT', 'ACTIVE', 'ARCHIVED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type hospital_source_kind as enum (
    'WEBSITE',
    'NAVER_BLOG',
    'YOUTUBE',
    'INSTAGRAM',
    'NAVER_BOOKING',
    'NAVER_TALK',
    'BRANDBOOK',
    'PDF',
    'DIRECT_INPUT',
    'OTHER'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type hospital_source_status as enum (
    'CONFIRMED',
    'REVIEW_REQUIRED',
    'DISABLED'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type hospital_fact_status as enum (
    'CONFIRMED',
    'UNCONFIRMED',
    'NEEDS_REVIEW',
    'UNKNOWN',
    'NOT_APPLICABLE'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type hospital_claim_compliance_status as enum (
    'UNCHECKED',
    'ALLOWED',
    'REVIEW_REQUIRED',
    'BLOCKED'
  );
exception when duplicate_object then null;
end $$;

alter table hospitals
  add column if not exists english_name text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists fax text,
  add column if not exists opened_on date,
  add column if not exists summary text,
  add column if not exists philosophy text,
  add column if not exists profile_status hospital_profile_status not null default 'DRAFT',
  add column if not exists profile_version integer not null default 1,
  add column if not exists archived_at timestamptz;

create table if not exists hospital_sources (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  kind hospital_source_kind not null,
  label text not null,
  url text,
  status hospital_source_status not null default 'CONFIRMED',
  is_primary boolean not null default false,
  source_date date,
  version_label text,
  content_text text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, kind, label)
);

create unique index if not exists hospital_sources_one_primary_naver_blog_idx
  on hospital_sources(hospital_id)
  where kind = 'NAVER_BLOG' and is_primary = true;

create table if not exists hospital_specialties (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  name text not null,
  priority integer,
  is_marketing_priority boolean not null default false,
  status hospital_fact_status not null default 'CONFIRMED',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, name)
);

create index if not exists hospital_specialties_hospital_priority_idx
  on hospital_specialties(hospital_id, priority nulls last);

create table if not exists hospital_service_offerings (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  source_id uuid references hospital_sources(id) on delete set null,
  channel text not null default 'NAVER_BOOKING',
  title text not null,
  detail text not null,
  booking_label text,
  sort_order integer not null default 100,
  status hospital_fact_status not null default 'CONFIRMED',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, channel, title)
);

create index if not exists hospital_service_offerings_sort_idx
  on hospital_service_offerings(hospital_id, channel, sort_order);

create table if not exists hospital_facts (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  fact_key text not null,
  category text not null,
  value text not null,
  status hospital_fact_status not null default 'CONFIRMED',
  evidence_source_id uuid references hospital_sources(id) on delete set null,
  version integer not null default 1,
  is_current boolean not null default true,
  valid_from timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, fact_key, version)
);

create index if not exists hospital_facts_current_idx
  on hospital_facts(hospital_id, fact_key)
  where is_current = true;

create table if not exists hospital_brand_claims (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  claim text not null,
  fact_status hospital_fact_status not null default 'CONFIRMED',
  compliance_status hospital_claim_compliance_status not null default 'UNCHECKED',
  evidence_source_id uuid references hospital_sources(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, claim)
);

create table if not exists hospital_ctas (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  kind text not null check (
    kind in ('PHONE', 'NAVER_BOOKING', 'NAVER_TALK', 'WEBSITE', 'OTHER')
  ),
  label text not null,
  url text,
  value text,
  priority integer not null default 100,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, kind, label)
);

create index if not exists hospital_ctas_hospital_priority_idx
  on hospital_ctas(hospital_id, priority);

create table if not exists hospital_writing_preferences (
  hospital_id uuid primary key references hospitals(id) on delete cascade,
  tone_strategy text not null default 'ADAPTIVE'
    check (tone_strategy in ('ADAPTIVE', 'FIXED')),
  default_tone text,
  preferred_phrases text[] not null default '{}',
  avoid_phrases text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hospital_sources enable row level security;
alter table hospital_specialties enable row level security;
alter table hospital_service_offerings enable row level security;
alter table hospital_facts enable row level security;
alter table hospital_brand_claims enable row level security;
alter table hospital_ctas enable row level security;
alter table hospital_writing_preferences enable row level security;
