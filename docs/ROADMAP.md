# Roadmap

## Phase 0 — Foundation ✅

## Phase 1 — Supabase + Better Auth ✅

## Phase 2 — Hospital Profile ✅

- 실제 Hospital 생성
- Hospital Sources
- Naver Booking 공식 소개 원문
- 예약 진료 항목 구조화
- Hospital Facts + Evidence
- Brand Claim + Compliance 상태 분리
- CTA 우선순위
- Primary Naver Blog 1개
- ADAPTIVE Tone
- 청맥병원 실데이터 Seed

추가 고도화는 후속 iteration에서:
- Profile 수정 UI
- Source/Fact/Service 개별 CRUD
- Private 파일 저장
- 공식 채널 자동 조사
- Hospital Adaptive Interview

## Phase 3 — Project / Keyword ✅

- 실제 `content_projects` DB
- 접근 가능한 Hospital 선택
- Primary Keyword
- Secondary Keywords 0..N
- MOBILE / DESKTOP / BOTH
- 프로젝트 목록/상세
- Workflow Stage = SERP
- 실제 Benchmark 전에는 가짜 분석 점수 미표시

## Phase 4 — Naver Blog Parser Migration (다음)

기존 `naver-post-crawler-web`에서 검증된 파서를 모듈 단위로 이식한다.

- fetch-post
- URL normalize
- mobile URL resolve
- title
- content text/html
- image URL/order
- parser versioning

## Phase 5 — Manual Benchmark Vertical Slice

자동 SERP가 없어도 분석 엔진을 먼저 검증할 수 있게 한다.

- Naver Blog URL 5~10개 수동 입력
- Parse
- Snapshot
- Benchmark include/exclude
- deterministic Article Features
- Analysis page 연결

## Phase 6 — Blog Context Analyzer
## Phase 7 — Automatic SERP Provider
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
