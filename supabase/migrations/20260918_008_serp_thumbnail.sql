alter table serp_results
  add column if not exists thumbnail_url text;

comment on column serp_results.thumbnail_url is
  'Naver 통합검색 카드에서 추출한 후보 게시글 썸네일 URL. Benchmark 선택 UI 표시용.';
