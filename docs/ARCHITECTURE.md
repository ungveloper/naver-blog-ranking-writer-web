# Architecture

## 1. Stack Direction

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui (Base UI + Nova)
- Better Auth (Google / Naver)
- Supabase PostgreSQL
- Supabase Storage (원문 HTML/PDF 등 필요 시)
- 기존 `naver-post-crawler-web`의 파서 로직 재사용 예정
- ChatGPT Pro 수동 워크플로우 → 추후 OpenAI API

## 2. Domain Modules

```text
app/
components/
lib/
  product/
  workflow/
  hospitals/
  serp/
  naver-blog/      # 이후 Parser 이식
  analysis/
  medical/         # 이후 Evidence Research
  ai/
  auth/            # 이후 Better Auth
  db/              # 이후 Supabase/Postgres
```

## 3. Provider Boundaries

### SERP Provider

분석 엔진은 특정 수집 방식에 종속되지 않는다.

```ts
interface SerpProvider {
  search(input: SerpSearchInput): Promise<SerpSnapshot>;
}
```

예정 구현:

- `ManualSerpProvider`
- `BrowserSerpProvider`
- `FutureAuthorizedProvider`

### AI Provider

v0.1은 ChatGPT Pro를 통한 수동 실행이므로 Prompt Packet을 생성하고 Structured JSON을 Import한다.

추후 OpenAI API 도입 시 동일 Contract를 유지한다.

## 4. Data Traceability

모든 분석은 재현 가능해야 한다.

- captured_at
- source URL
- content snapshot/hash
- parser_version
- feature_extractor_version
- scoring_version
- prompt_version
- benchmark set
- evidence sources

## 5. Authentication

예정 구조:

```text
Better Auth
  ├ Google
  └ Naver
       ↓
Supabase PostgreSQL
```

사용자와 병원 관계는 many-to-many:

```text
users
hospitals
hospital_members
  ├ OWNER
  ├ EDITOR
  └ VIEWER
```

## 6. Safety / Medical Integrity Boundary

- 병원 고유 정보는 근거 없이 생성하지 않는다.
- 일반 의료 정보는 허용된 Evidence Source에 기반한다.
- 상위 문서 패턴은 분석하지만 근거와 충돌하는 단정 문구는 그대로 생성하지 않는다.
- 충돌하는 근거는 `CONFLICT` 상태로 보낸다.
