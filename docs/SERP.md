# Naver Integrated Search Blog Benchmark

## 제품 기준

Benchmark의 검색 후보는 Naver 블로그 검색탭 결과가 아니다.

반드시:

```text
Primary Keyword
→ Naver 통합검색
→ 통합검색 페이지 내부
→ 실제 Naver Blog 게시글
→ DOM 노출 순서
→ Benchmark 후보
```

만 사용한다.

## 첨부 HTML에서 확인한 구조

현재 Naver 통합검색은 FENDER root 단위로 결과를 렌더링하며 다음과 같은 진단 속성을 노출한다.

- `data-fender-root="true"`
- `data-meta-ssc="tab.nx.all"` (PC 통합검색 예)
- `data-meta-area`
- `data-block-id`

Naver Blog 게시글은 한 가지 template에만 고정되지 않는다.
`review/prs_template_v2_review_blog_rra_*`뿐 아니라 `web/prs_template_v2_web_basic_*` 같은 root에도 실제 Blog 게시글 URL이 들어갈 수 있다.

따라서 특정 CSS class 하나가 아니라:

1. 현재 요청한 페이지 자체가 Naver 통합검색인지 보장
2. FENDER root DOM 순서를 보존
3. 각 root 내부에서 `blog.naver.com/{blogId}/{numericLogNo}` 실제 게시글 URL만 채택
4. 같은 게시글의 제목/본문/이미지 링크 중복 제거
5. 실제 게시글만의 순서로 Blog rank 생성

방식을 사용한다.

## 표본 수

목표는 5~10개다.

하지만 통합검색에서 실제 Naver Blog 게시글이 4개만 노출되면:
- 블로그탭에서 5번째를 채우지 않는다.
- 4개가 현재 snapshot의 실제 전체 표본이다.
- 분석은 허용한다.
- `LIMITED` 표본 경고를 표시한다.

관련 없는 결과를 사용자가 제외해 1~4개가 남아도 동일하게 제한 표본으로 분석할 수 있다.

## Provider

1. `NAVER_HTTP_INTEGRATED`
2. `NAVER_LOCAL_BROWSER_INTEGRATED`

둘 모두 같은 통합검색 URL만 사용한다.

별도:
- blog tab
- VIEW tab
- 검색 API의 독립 블로그 결과

를 Benchmark 보완용으로 섞지 않는다.

## 보안

CAPTCHA/접근 제한은 우회하지 않는다.

## 저장 진단값

`serp_results`에:
- `section_area`
- `block_id`
- `dom_index`

를 함께 저장해 Naver 구조 변경 시 실제 어느 통합검색 root에서 수집했는지 확인할 수 있게 한다.
