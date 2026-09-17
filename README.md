# naver-blog-ranking-writer-web

네이버 블로그 상위 노출 콘텐츠를 **현재 검색 결과와 블로그 컨텍스트까지 함께 분석**하고, 병원/의료 근거와 Adaptive Interview를 결합해 네이버 블로그 게시용 원고를 만드는 내부 마케팅 도구입니다.

## Primary Goal

가장 중요한 목표는 **네이버 검색 상위 노출 경쟁력이 높은 콘텐츠를 만드는 것**입니다.

다만 네이버의 실제 랭킹 공식은 공개되어 있지 않으므로, 이 프로젝트는 다음 두 축을 함께 사용합니다.

1. 현재 네이버에서 실제 상위 노출되고 있는 블로그 문서와 출처의 관찰 가능한 패턴
2. 네이버가 공개한 검색/콘텐츠 품질 원칙

의료 콘텐츠에서는 여기에 검증 가능한 Hospital Evidence / Medical Evidence를 결합합니다.

## Core Flow

```text
Hospital 선택/등록
  → Primary Keyword 입력
  → Secondary Keywords 선택 입력
  → 모바일 우선 SERP 수집 (PC 참고 가능)
  → 네이버 블로그 후보 자동 수집 + 사용자 포함/제외
  → Benchmark 5~10개 (기본 7개)
  → Article Deep Analysis
  → Blog Context Analysis
  → Search Intent / Content Archetype
  → Medical Evidence Research
  → Hospital Evidence 매칭
  → Missing Information 탐지
  → Adaptive Interview (3~5개 질문/라운드)
  → READY TO WRITE Gate
  → Content Blueprint
  → ChatGPT Pro Draft
  → Benchmark Revision
  → Evidence / Medical Review
  → 네이버 블로그 게시용 Plain Text Package
```

## v0.1 Principles

- 모바일/로그아웃 환경을 Primary SERP로 취급하고 PC는 선택 가능한 참고 환경으로 둡니다.
- 경쟁 분석은 네이버 블로그 글에 집중합니다.
- Benchmark 기본값은 7개, 최소 5개, 최대 10개입니다.
- Primary Keyword가 분석의 중심이며 Secondary Keywords와 연관검색어는 낮은 가중치로만 보조합니다.
- 원문 텍스트 snapshot과 분석 근거를 보존해 결과를 역추적할 수 있게 합니다.
- 병원 고유 정보는 추정하지 않습니다.
- 일반 의료 정보는 신뢰 가능한 공식/전문 근거에 기반합니다.
- 경쟁문서의 구조와 검색 의도 대응 방식을 벤치마킹하되 특정 문장 복제는 목표가 아닙니다.
- READY TO WRITE 기본 기준은 Content Fit 예상점수 85 이상입니다.
- 글자 수는 상위 문서 분포 기반의 **권장 범위**이며 억지 분량 채우기를 금지합니다.
- 초기 AI 실행은 ChatGPT Pro 수동 Copy/Paste + Structured JSON Import 방식입니다.
- 추후 OpenAI API 자동화가 가능하도록 Prompt/JSON Contract를 고정합니다.

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — 확정 제품 요구사항
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 기술/도메인 구조
- [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) — Supabase/Postgres 데이터 모델
- [`docs/ANALYSIS-SPEC.md`](docs/ANALYSIS-SPEC.md) — Article/Blog Context/Score 분석 규칙
- [`docs/AI-WORKFLOW.md`](docs/AI-WORKFLOW.md) — ChatGPT Pro 및 Adaptive Interview 계약
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 단계별 구현 순서
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — 인터뷰에서 확정된 주요 결정
- [`docs/supabase/schema.sql`](docs/supabase/schema.sql) — 향후 적용용 초기 SQL 초안

## Current Foundation

현재 커밋은 v0.1 제품 기준과 향후 구현 계약을 코드/문서에 고정하는 단계입니다. Supabase, Better Auth, 실제 SERP 자동화, 네이버 Parser 이식은 이후 Phase에서 연결합니다.
