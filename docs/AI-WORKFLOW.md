# AI Workflow — ChatGPT Pro First

## Principle

v0.1에서는 OpenAI API를 사용하지 않는다.

웹앱은 AI를 직접 호출하는 대신:

1. Prompt Packet 생성
2. ChatGPT Pro에서 실행
3. Structured JSON을 결과 마지막에 생성
4. 웹앱에 JSON Import

하는 구조다.

추후 API 도입 시 동일 Contract를 재사용한다.

## Pipeline

```text
SERP/Benchmark 분석
  → Medical Research Packet
  → Medical Evidence Import
  → Hospital Evidence 확인
  → Adaptive Interview Packet
  → Interview JSON Import
  → READY TO WRITE
  → Writing Packet
  → Draft Import
  → Revision Packet
  → Final Import
```

## Adaptive Interview Rules

- 한 라운드 3~5개 질문
- 답변에 따라 다음 질문을 동적으로 결정
- 병원 고유 정보는 추정하지 않음
- Evidence로 해결 가능한 일반 의료정보는 사용자에게 반복 질문하지 않음
- 질문에는 `왜 이 질문이 필요한지` reason을 함께 표시
- `모름 / 병원 확인 필요 / 제외 / 해당 없음` 상태를 허용

## Interview JSON Contract

```json
{
  "status": "NEEDS_MORE_INFO",
  "round": 2,
  "questions": [
    {
      "id": "q_treatment_process",
      "fieldKey": "treatment.process",
      "question": "...",
      "reason": "...",
      "priority": "required",
      "answerType": "long_text",
      "evidenceRequired": true
    }
  ],
  "confirmedFacts": [],
  "unknownFacts": [],
  "contentRequirements": []
}
```

READY 예시:

```json
{
  "status": "READY",
  "round": 4,
  "questions": [],
  "confirmedFacts": [],
  "unknownFacts": [],
  "contentRequirements": [],
  "recommendedTone": {
    "id": "professional_easy",
    "reason": "..."
  }
}
```

## Writing Roles

한 번에 모든 일을 시키지 않고 역할을 분리한다.

1. Research Analyst
2. Content Strategist
3. Medical Blog Writer
4. Compliance & Quality Reviewer

## Revision

최종 원고 후 반드시 한 차례 Benchmark Revision을 수행한다.

검토:

- 상위 Benchmark 대비 중요 정보 누락
- 검색의도 이탈
- 근거 없는 병원 고유 주장
- Evidence 충돌
- 반복/장황함
- 과도한 키워드 사용
- 특정 경쟁문서 문장과의 과도한 일치 (안전장치 수준)
