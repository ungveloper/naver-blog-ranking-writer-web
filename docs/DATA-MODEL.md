# Data Model

## Core Entities

### users
Better Auth 사용자.

### hospitals
재사용 가능한 Hospital Profile의 루트 Entity.

### hospital_members
사용자-병원 many-to-many 관계.

- OWNER
- EDITOR
- VIEWER

### hospital_sources
병원 공식 Evidence Source.

- WEBSITE
- NAVER_BLOG
- YOUTUBE
- INSTAGRAM
- NAVER_BOOKING
- NAVER_TALK
- BRANDBOOK
- PDF
- DIRECT_INPUT
- OTHER

공식 채널의 원문 소개는 `content_text`에 보관할 수 있다.

### hospital_service_offerings
네이버 예약 같은 공식 채널에 실제 노출되는 진료/예약 항목.

### hospital_facts
병원 고유 사실 및 검증 상태.

- CONFIRMED
- UNCONFIRMED
- NEEDS_REVIEW
- UNKNOWN
- NOT_APPLICABLE

### hospital_brand_claims
병원이 실제로 밀고 싶은 표현.

`fact_status`와 `compliance_status`를 분리한다.

### hospital_ctas
전화 / 네이버 예약 / 톡톡 등 기본 전환 경로.

### hospital_writing_preferences
병원 단위 작성 정책. 기본 Tone 전략은 `ADAPTIVE`.

---

### content_projects
한 편의 콘텐츠 제작 작업.

Hospital과 분리되어 있고 포스팅마다 새로 생성한다.

주요 컬럼:

- `hospital_id`
- `created_by`
- `primary_keyword`
- `secondary_keywords text[]`
- `device_preference`
- `workflow_stage`
- `status`

Primary Keyword는 프로젝트의 분석 중심이다.

Secondary Keywords는 Primary 방향을 바꾸지 않는 보조 문맥 신호로만 사용한다.

동일 병원 + 동일 키워드 프로젝트도 시점이 다르면 다시 만들 수 있으므로 unique 제약을 두지 않는다.

프로젝트 생성 직후에는 Hospital과 Keyword 입력이 완료된 것으로 보고 `workflow_stage = SERP`에서 시작한다.

---

### serp_snapshots
검색 시점/환경 단위 snapshot.

- MOBILE / DESKTOP
- captured_at
- logged_out 기준 지향

### serp_results
SERP 후보 결과.

- rank
- title
- url
- normalized_url
- included/excluded
- exclusion_reason

### source_documents
Benchmark 원문 snapshot.

- title
- source_url
- canonical_url
- content_text
- content_hash
- published_at
- captured_at
- parser_version
- structural_features jsonb
- image_metadata jsonb

원본 HTML은 필요 시 Storage로 분리 가능.

### blog_sources
블로그 출처/작성자 컨텍스트.

### blog_source_posts
최근 글/관련 글 metadata 및 일부 deep parse.

### analysis_runs
한 번의 분석 버전 루트.

- feature_extractor_version
- scoring_version
- prompt_version

### article_features
문서 단위 정량/정성 Feature.

### source_features
Blog Context Feature.

### medical_sources
정부/학회/가이드라인/논문 등.

### medical_evidence
원고에 사용할 의학적 Claim과 Evidence 매핑.

### interview_rounds
Adaptive Interview round 기록.

### content_blueprints
READY TO WRITE 이후 생성되는 구조.

### drafts
Draft/Final 버전.

### reviews
Benchmark Revision / Evidence Review / Compliance Review.

### future: post_keyword_rankings
v0.1 이후 순위 추적용.

## Flexible vs Relational

관계/조회가 중요한 데이터는 정규 컬럼으로, 키워드/진료과에 따라 구조가 달라지는 데이터는 `jsonb`로 저장한다.
