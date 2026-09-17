# Analysis Spec

## 1. Article Deep Analysis

초기 Feature 후보:

- titleLength
- keywordInTitle
- keywordTitlePosition
- contentLength
- paragraphCount
- averageParagraphLength
- imageCount
- firstImagePosition
- exactKeywordCount
- keywordInFirst300Chars
- numericExpressionCount
- questionCount
- headingCount
- listCount
- ctaDetected
- ctaPosition
- introLength
- conclusionLength
- publishedAt / freshness

의미론 분석은 ChatGPT 단계에서 추가:

- Search Intent
- Content Archetype
- Intro Strategy
- Narrative Structure
- User Anxiety
- Questions Answered
- Missing Questions
- Trust Signals
- Medical Expertise Signals
- CTA Strategy
- Content Gaps

## 2. Blog Context Analysis

Benchmark 문서 출처마다:

- 최근 글 최대 20개
- Primary Keyword 관련 글 최대 10개
- 관련 글 일부 본문 Deep Parse

관찰 Feature:

- recentPostingFrequency
- topicFocus
- relatedPostCount
- contentDepth
- recentActivity
- averageLength
- imagePattern
- publicEngagement

`Source Context Score`는 내부 분석 점수이며 네이버 공식 지수가 아니다.

## 3. Benchmark Aggregation

단순 평균만 사용하지 않는다.

- median
- min/max
- percentile 25/75
- frequency
- common pattern ratio

예:

```text
first 300 chars에 Primary Keyword 존재: 6/7
FAQ 섹션 존재: 5/7
부작용/주의사항 언급: 6/7
이미지 수 중앙값: 13
```

## 4. Recency Weight

오래된 상위글도 분석하되 최근 상위글에 상대적으로 더 높은 가중치를 준다.

정확한 가중치 함수는 실데이터 축적 후 조정한다.

## 5. Secondary / Related Queries

Primary Keyword가 항상 중심.

Secondary Keywords와 연관검색/자동완성은 Content Gap 보조 신호로만 사용한다.

## 6. Content Fit Score

초기 제안 가중치:

| Dimension | Weight |
| --- | ---: |
| Search Intent Fit | 22 |
| Information Completeness | 20 |
| Benchmark Pattern Coverage | 18 |
| Evidence Strength | 16 |
| Hospital/Unique Information | 10 |
| Readability | 8 |
| CTA Fit | 6 |

총 100점.

실제 가중치는 own_performance 데이터 축적 이후 버전업한다.

## 7. Source Context Score

초기 제안 가중치:

| Dimension | Weight |
| --- | ---: |
| Topic Focus | 28 |
| Related Content Accumulation | 22 |
| Recent Activity | 16 |
| Posting Consistency | 14 |
| Content Depth | 12 |
| Public Engagement | 8 |

총 100점.

## 8. Feature Provenance

모든 중요 Feature/추천에는 가능한 한 근거 유형을 남긴다.

- `benchmark`
- `naver_guideline`
- `medical_evidence`
- `hospital_evidence`
- `own_performance` (미래)

## 9. Content Length

상위 문서 분포를 기반으로 권장 범위를 제안한다.

분량을 맞추기 위한 반복/군더더기/의미 없는 확장은 금지한다.
