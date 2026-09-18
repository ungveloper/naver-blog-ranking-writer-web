# Naver SERP Candidate Discovery

## 기본 흐름

사용자가 Naver Blog URL을 복사해 입력하지 않는다.

```text
Content Project
→ Primary Keyword
→ Naver 검색 실행
→ 모바일 통합검색 실제 노출 HTML
→ Naver Blog 포스트 URL만 필터/정규화/중복 제거
→ 후보 목록 표시
→ 사용자가 관련 없는 결과만 제외
→ 최종 5~10개 Benchmark
→ 본문 Parser + Article Features
```

## 기준

- MOBILE이 기본이자 주 기준이다.
- DESKTOP은 선택 또는 BOTH일 때 참고 snapshot으로 저장한다.
- 통합검색 노출 후보가 우선이다.
- 통합검색에서 후보가 부족하면 Naver VIEW 검색을 보완 후보로 가져오며 UI에서 `VIEW_FALLBACK`으로 명확히 구분한다.
- VIEW 보완 후보를 통합검색 순위라고 표현하지 않는다.
- 로그인 쿠키를 사용하지 않는 서버 요청을 기준으로 한다.
- CAPTCHA/보안 확인/접근 제한 우회는 구현하지 않는다.
- 검색 HTML 구조 변경으로 후보를 찾지 못하면 오류를 표시하고 Parser를 업데이트한다.

## 데이터

### serp_snapshots

- project_id
- keyword
- device
- provider
- search_url
- response_hash
- result_count
- captured_at

### serp_results

- snapshot_id
- rank
- title
- url
- normalized_url
- origin
- included
- exclusion_reason

`rank`는 해당 snapshot에서 추출된 후보의 노출 순서다.

`origin`:
- `INTEGRATED`: 통합검색 HTML에서 발견
- `VIEW_FALLBACK`: 통합검색 후보 부족 시 VIEW 검색에서 추가

## Provider

`SerpProvider` 추상화는 유지한다.

현재:
- `NaverIntegratedSearchProvider`
- `ManualSerpProvider` (비상 fallback 계약만 유지, 기본 UI에서는 사용하지 않음)

향후:
- BrowserCaptureProvider
- AuthorizedProvider

현재 구현이 막혔다고 해서 CAPTCHA 우회, IP rotation, 자동 회피 로직을 추가하지 않는다.
