alter table serp_results
  drop constraint if exists serp_results_origin_check;

alter table serp_results
  add constraint serp_results_origin_check
  check (
    origin in (
      'INTEGRATED',
      'BLOG_TAB_FALLBACK',
      'VIEW_FALLBACK'
    )
  );

comment on column serp_results.origin is
  'INTEGRATED=통합검색 실제 노출, BLOG_TAB_FALLBACK=통합검색 Blog 후보 부족 시 현재 Naver 블로그 검색탭 관련도순 보완 후보, VIEW_FALLBACK=과거 snapshot 호환용.';
