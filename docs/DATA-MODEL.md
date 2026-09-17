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

- official_website
- official_naver_blog
- youtube
- instagram
- pdf
- brochure
- manual

### hospital_facts
병원 고유 사실 및 검증 상태.

- VERIFIED
- UNVERIFIED
- NEEDS_REVIEW
- UNKNOWN
- NOT_APPLICABLE

### projects
한 편의 콘텐츠 제작 작업.

Hospital과 분리되어 있고 포스팅마다 새로 생성.

### project_keywords
- PRIMARY 1개
- SECONDARY 0..N

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

예:

```text
brief_payload jsonb
questions jsonb
answers jsonb
structural_features jsonb
image_metadata jsonb
```
