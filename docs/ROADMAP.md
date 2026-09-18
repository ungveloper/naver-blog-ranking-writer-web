# Roadmap

## Phase 0 — Foundation ✅
## Phase 1 — Supabase + Better Auth ✅
## Phase 2 — Hospital Profile ✅
## Phase 3 — Project / Keyword ✅
## Phase 4 — Naver Blog Parser Migration ✅
## Phase 5 — Benchmark Vertical Slice ✅

- 실제 Naver Blog parser
- source snapshot
- deterministic Article Features
- Benchmark aggregate

## Automatic SERP Candidate Discovery ✅

기존 Manual URL 입력을 기본 UI에서 제거.

- Primary Keyword로 Naver 직접 검색
- MOBILE 통합검색 주 기준
- DESKTOP 선택/참고
- 실제 노출 Naver Blog URL 자동 추출
- normalize / dedupe
- 후보 순서 보존
- 통합검색 우선
- 부족 시 VIEW_FALLBACK 명시
- 사용자 include/exclude
- 최종 Benchmark 5~10개
- CAPTCHA/보안 확인 우회 금지

## Phase 6 — Blog Context Analyzer (다음)

- Benchmark source의 최근 글 최대 20개
- Keyword 관련 글 최대 10개
- 일부 Deep Parse
- posting frequency
- topic concentration
- related post count
- freshness / consistency
- Source Context Score

## Phase 7 — SERP Provider 고도화

- HTML 구조 변화 대응
- BrowserCaptureProvider
- 자동 후보 품질 개선
- PC 비교 강화
- snapshot diagnostics
- manual fallback은 비상용으로만 유지

## Phase 8 — Medical Evidence
## Phase 9 — Adaptive Interview
## Phase 10 — Writer / Revision / Final

## v0.2+

- 이미지 내용 AI 분석
- OpenAI API 자동화
- Chrome Extension
- 자동 순위 추적
- 유입/신환/매출 Attribution
- own_performance 기반 가중치 학습
