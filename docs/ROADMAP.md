# Roadmap

## Phase 0 — Foundation ✅
## Phase 1 — Supabase + Better Auth ✅
## Phase 2 — Hospital Profile ✅
## Phase 3 — Project / Keyword ✅

## Phase 4 — Naver Blog Parser Migration ✅

기존 `naver-post-crawler-web`의 검증된 접근을 현재 구조로 이식.

- Naver Blog URL 검증/정규화
- mobile URL resolve
- server-side fetch
- title
- content text/html
- image URL/order snapshot
- published date best-effort
- parser versioning

## Phase 5 — Manual Benchmark Vertical Slice ✅

- Naver Blog URL 5~10개 수동 입력
- Parser 실행
- Source snapshot
- Benchmark set 저장
- deterministic Article Features
- 중앙값/범위 집계
- Analysis page 실제 데이터 연결
- 실제 Benchmark 전 가짜 점수 미표시

## Phase 6 — Blog Context Analyzer (다음)

- Primary 공식 Blog 및 Benchmark source context
- 최근 글 최대 20개
- 관련 글 최대 10개
- 일부 Deep Parse
- Source Context Score

## Phase 7 — Automatic SERP Provider

- MOBILE 기본
- PC 선택
- 자동 후보 수집
- 의미 기반 Naver Blog URL 필터
- 사용자 포함/제외
- Manual fallback 유지
- 우회/캡차 회피 구현 금지

## Phase 8 — Medical Evidence
## Phase 9 — Adaptive Interview
## Phase 10 — Writer / Revision / Final

## v0.2+

- 이미지 AI 분석
- OpenAI API 자동화
- Chrome Extension
- 자동 순위 추적
- 유입/신환/매출 Attribution
- own_performance 기반 가중치 학습
