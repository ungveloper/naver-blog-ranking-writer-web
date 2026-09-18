# Benchmark UX

## 후보 카드

한 카드에서 다음을 분리해 표시한다.

- 순번
- `통합검색` badge
- `Naver Blog` badge
- 통합검색 렌더링 블록 (`후기형`, `웹문서형`, `기타`)
- 출처명
- 제목
- snippet
- 원문 URL

제목과 snippet은 같은 문자열로 합치지 않는다.

## Parser

동일 Blog post URL이 하나의 카드에서 profile/title/content/image 링크로 여러 번 나타날 수 있다.

따라서:
- URL 기준 dedupe
- headline element가 있는 anchor/card를 최우선
- 단순히 "가장 긴 anchor text"를 제목으로 선택하지 않음
- card body는 snippet으로 별도 저장

## 실행 상태

주요 서버 액션은 `useFormStatus` 기반 pending 표시를 사용한다.

- 파랑: SERP 수집
- 초록: Benchmark 분석
- 보라: ChatGPT Pro 다음 단계

## Prompt

현재 ARTICLE_ANALYSIS 시점에는 최종 집필 Prompt를 열지 않는다.

대신 Benchmark + Hospital Profile을 패키징한 ChatGPT Pro 다음 단계 분석 Prompt를 제공한다.

최종 집필 Prompt는 Blog Context / Medical Evidence / Hospital Evidence / Adaptive Interview / READY TO WRITE 이후 활성화한다.
