create table if not exists content_projects (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete restrict,
  created_by text not null references "user"(id) on delete restrict,
  primary_keyword text not null,
  secondary_keywords text[] not null default '{}',
  device_preference text not null default 'MOBILE'
    check (device_preference in ('MOBILE', 'DESKTOP', 'BOTH')),
  workflow_stage text not null default 'SERP'
    check (
      workflow_stage in (
        'HOSPITAL',
        'KEYWORD',
        'SERP',
        'BENCHMARK_SELECTION',
        'ARTICLE_ANALYSIS',
        'BLOG_CONTEXT_ANALYSIS',
        'MEDICAL_RESEARCH',
        'HOSPITAL_EVIDENCE',
        'INTERVIEW',
        'READY_TO_WRITE',
        'BLUEPRINT',
        'DRAFT',
        'REVISION',
        'FINAL'
      )
    ),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_projects_hospital_id_idx
  on content_projects(hospital_id);

create index if not exists content_projects_created_by_idx
  on content_projects(created_by);

create index if not exists content_projects_active_created_at_idx
  on content_projects(created_at desc)
  where status = 'ACTIVE';

alter table content_projects enable row level security;

comment on table content_projects is
  '한 편의 콘텐츠 제작 작업. Hospital Profile과 분리되며 매 프로젝트마다 Primary Keyword를 새로 입력한다.';

comment on column content_projects.primary_keyword is
  '현재 프로젝트 분석의 중심 키워드. Hospital Profile에 고정하지 않는다.';

comment on column content_projects.secondary_keywords is
  '보조 문맥용 키워드. Primary Keyword 방향을 흐리지 않도록 낮은 가중치로 사용한다.';

comment on column content_projects.workflow_stage is
  '프로젝트 생성 시 HOSPITAL/KEYWORD 입력이 끝난 것으로 보고 SERP 단계부터 시작한다.';
