# Roadmap

## Phase 0 — Foundation (현재)

- Next.js / Tailwind / shadcn/ui
- PRD/Architecture/Data Model 고정
- Domain types
- SERP Provider contract
- Scoring contract
- Adaptive Interview JSON contract
- 화면 Skeleton

## Phase 1 — Supabase + Better Auth

- Supabase PostgreSQL
- Better Auth
- Google Login
- Naver Login
- users / hospitals / hospital_members

## Phase 2 — Hospital Profile

- Hospital 생성
- 공식 홈페이지/채널 조사
- Hospital Source 저장
- Hospital Fact 상태 관리
- OWNER/EDITOR/VIEWER

## Phase 3 — Project / Keyword

- Primary Keyword
- Secondary Keywords
- Device preference
- Project lifecycle

## Phase 4 — Naver Blog Parser Migration

기존 `naver-post-crawler-web`의 검증된 로직 이식 및 모듈 분리.

- URL normalize
- mobile URL resolve
- title
- content text/html
- image URLs/order
- parser versioning

## Phase 5 — Manual Benchmark Vertical Slice

- URL 5~10개 수동 입력
- Parser
- Snapshot
- Article Features
- Analysis page

자동 SERP가 없어도 분석 엔진을 검증할 수 있어야 한다.

## Phase 6 — Blog Context Analyzer

- 최근 글 최대 20개
- 관련 글 최대 10개
- 일부 Deep Parse
- Source Context Score

## Phase 7 — Automatic SERP Provider

- 모바일 기본
- PC 선택
- 자동 후보 수집
- 블로그 URL 의미 기반 필터링
- 사용자 포함/제외
- 수동 fallback

## Phase 8 — Medical Evidence

- Medical Research Prompt
- Source import
- Conflict state
- Claim-Evidence mapping

## Phase 9 — Adaptive Interview

- 3~5 questions per round
- JSON import
- completeness gate
- READY TO WRITE >= 85

## Phase 10 — Writer / Revision / Final

- 제목 후보 5 + 추천 1
- 네이버 게시용 Plain Text
- 이미지 슬롯
- CTA
- 참고자료
- Benchmark Revision

## v0.2+

- 이미지 내용 AI 분석
- OpenAI API 자동화
- Chrome Extension
- 자동 순위 추적
- 순위 하락 알림
- 블로그 유입/신환/매출 Attribution
- own_performance 기반 가중치 학습
