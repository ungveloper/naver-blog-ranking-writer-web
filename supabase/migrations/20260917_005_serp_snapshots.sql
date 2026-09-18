create table if not exists serp_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references content_projects(id) on delete cascade,
  keyword text not null,
  device text not null
    check (device in ('MOBILE', 'DESKTOP')),
  provider text not null,
  search_url text not null,
  response_hash text,
  result_count integer not null default 0,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists serp_snapshots_project_device_captured_idx
  on serp_snapshots(project_id, device, captured_at desc);

create table if not exists serp_results (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references serp_snapshots(id) on delete cascade,
  rank integer not null check (rank > 0),
  title text not null,
  url text not null,
  normalized_url text not null,
  origin text not null default 'INTEGRATED'
    check (origin in ('INTEGRATED', 'VIEW_FALLBACK')),
  included boolean not null default false,
  exclusion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (snapshot_id, rank),
  unique (snapshot_id, normalized_url)
);

create index if not exists serp_results_snapshot_rank_idx
  on serp_results(snapshot_id, rank);

alter table serp_snapshots enable row level security;
alter table serp_results enable row level security;

comment on table serp_snapshots is
  '프로젝트 Primary Keyword로 실제 Naver 검색을 수행한 시점별 SERP snapshot.';
comment on table serp_results is
  'Naver 검색 HTML에서 실제 노출 순서대로 발견한 Naver Blog 글 후보. 통합검색 후보가 우선이며 부족할 때 VIEW 결과를 보완 후보로 추가할 수 있다.';
