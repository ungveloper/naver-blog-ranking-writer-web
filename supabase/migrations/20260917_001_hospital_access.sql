create extension if not exists pgcrypto;

do $$
begin
  create type hospital_member_role as enum ('OWNER', 'EDITOR', 'VIEWER');
exception
  when duplicate_object then null;
end $$;

create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  website_url text,
  is_test boolean not null default false,
  created_by text not null references "user"(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hospital_members (
  hospital_id uuid not null references hospitals(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  role hospital_member_role not null default 'VIEWER',
  created_at timestamptz not null default now(),
  primary key (hospital_id, user_id)
);

create index if not exists hospital_members_user_id_idx
  on hospital_members(user_id);

alter table hospitals enable row level security;
alter table hospital_members enable row level security;

comment on table hospitals is
  'Hospital Profile의 루트 Entity. 실제 상세 Profile/Source/Fact는 Phase 2에서 확장한다.';
comment on table hospital_members is
  '사용자와 병원의 N:M 관계 및 OWNER/EDITOR/VIEWER 권한.';
