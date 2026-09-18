alter table serp_results
  add column if not exists section_area text;

alter table serp_results
  add column if not exists block_id text;

alter table serp_results
  add column if not exists dom_index integer;

comment on column serp_results.rank is
  '현재 통합검색 snapshot 안에서 실제 Naver Blog 게시글만 추렸을 때의 DOM 노출 순서. 전체 웹문서 순위나 블로그탭 순위가 아님.';

comment on column serp_results.section_area is
  'Naver 통합검색 FENDER root의 data-meta-area 진단값.';

comment on column serp_results.block_id is
  'Naver 통합검색 FENDER root의 data-block-id 진단값.';

comment on column serp_results.dom_index is
  '통합검색 HTML 안 FENDER root의 DOM 순서 진단값.';
