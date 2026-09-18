alter table serp_results
  add column if not exists snippet text;

alter table serp_results
  add column if not exists source_name text;

alter table serp_results
  add column if not exists section_kind text;

alter table serp_results
  drop constraint if exists serp_results_section_kind_check;

alter table serp_results
  add constraint serp_results_section_kind_check
  check (
    section_kind is null
    or section_kind in (
      'REVIEW_BLOG',
      'WEB_BLOG',
      'OTHER'
    )
  );

comment on column serp_results.snippet is
  '통합검색 카드에서 분리한 짧은 내용 요약. 제목과 구분해 UI에 표시.';

comment on column serp_results.source_name is
  '통합검색 카드의 Blog/작성 주체 표시명.';

comment on column serp_results.section_kind is
  '통합검색 내부 렌더링 블록 분류: REVIEW_BLOG, WEB_BLOG, OTHER.';
