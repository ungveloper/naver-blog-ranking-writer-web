create table if not exists source_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references content_projects(id) on delete cascade,
  source_url text not null,
  canonical_url text not null,
  title text not null,
  content_text text not null,
  content_html text not null,
  image_urls jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  content_hash text not null,
  parser_version text not null,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, canonical_url)
);

create index if not exists source_documents_project_id_idx
  on source_documents(project_id);

create table if not exists project_benchmarks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references content_projects(id) on delete cascade,
  source_document_id uuid not null references source_documents(id) on delete cascade,
  position integer not null check (position between 1 and 10),
  included boolean not null default true,
  exclusion_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, source_document_id),
  unique (project_id, position)
);

create index if not exists project_benchmarks_project_id_idx
  on project_benchmarks(project_id, position);

create table if not exists article_features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references content_projects(id) on delete cascade,
  source_document_id uuid not null references source_documents(id) on delete cascade,
  extractor_version text not null,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_document_id)
);

create index if not exists article_features_project_id_idx
  on article_features(project_id);

alter table source_documents enable row level security;
alter table project_benchmarks enable row level security;
alter table article_features enable row level security;

comment on table source_documents is
  'Benchmark로 사용할 Naver Blog 글의 파싱 시점 원문 snapshot.';
comment on table project_benchmarks is
  '프로젝트별 최종 Benchmark 5~10개. Manual Vertical Slice에서는 입력 URL 자체가 최종 포함 set.';
comment on table article_features is
  'Benchmark 문서의 deterministic Article Feature snapshot.';
