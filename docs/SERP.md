# Naver SERP Candidate Discovery

## 기본 흐름

사용자가 Naver Blog URL을 직접 입력하지 않는다.

```text
Content Project
→ Primary Keyword
→ Naver 통합검색 실행
→ 실제 통합검색의 Naver Blog 글 추출
→ 부족한 경우 현재 Naver 블로그 검색탭 관련도순으로 보완
→ URL 정규화 / 중복 제거
→ 후보 목록
→ 사용자가 관련 없는 결과만 제외
→ 최종 5~10개 Benchmark
→ 본문 Parser + Article Features
```

## 통합검색과 블로그탭은 같은 순위가 아니다

`INTEGRATED`
- 실제 통합검색 HTML에서 발견한 Naver Blog 글.
- 가장 우선한다.

`BLOG_TAB_FALLBACK`
- 통합검색의 Naver Blog 글이 Benchmark 최소 수를 충족하지 못할 때만 추가한다.
- Naver 블로그 검색탭의 관련도순 후보다.
- UI에서 `블로그탭 보완 후보`로 표시한다.
- 통합검색 순위라고 표현하지 않는다.

`VIEW_FALLBACK`
- 과거 개발 snapshot DB 호환용.
- 신규 검색에는 사용하지 않는다.

Naver는 2024-02-01 VIEW 탭을 블로그/카페 탭으로 전환했으므로 신규 보완 수집에서 VIEW 검색을 사용하지 않는다.

## 블로그탭 보완

현재 보완 검색은 `ssc=tab.blog.all`을 사용한다.

후보가 부족하면 관련도순에서 `start=1`, `11`, `21`을 순서대로 확인한다.
전체 후보는 최대 20개만 저장한다.

## Provider

각 검색 표면마다:

1. `NAVER_HTTP_HTML`
2. `NAVER_LOCAL_BROWSER_DOM`

HTTP가 정상 검색 HTML을 주면 그대로 사용하고,
그렇지 않으면 로컬 Chrome/Chromium DOM으로 다시 확인한다.

CAPTCHA나 접근 제한은 우회하지 않는다.
