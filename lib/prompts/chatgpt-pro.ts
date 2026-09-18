import type {
  BenchmarkDocument,
} from "@/lib/benchmarks/repository";
import type {
  HospitalProfileDetails,
} from "@/lib/hospitals/repository";
import type {
  ContentProjectDetails,
} from "@/lib/projects/repository";

type BenchmarkSummary = {
  count: number;
  sampleAdequacy: "STANDARD" | "LIMITED";
  textLengthMedian: number;
  textLengthMin: number;
  textLengthMax: number;
  imageCountMedian: number;
  imageCountMin: number;
  imageCountMax: number;
  keywordCountMedian: number;
  keywordCountMin: number;
  keywordCountMax: number;
  titleKeywordMatchCount: number;
};

type Input = {
  project: ContentProjectDetails;
  hospital: HospitalProfileDetails;
  benchmarks: BenchmarkDocument[];
  summary: BenchmarkSummary;
};

function bullet(
  values: Array<string | null | undefined>,
) {
  const filtered = values.filter(
    (value): value is string =>
      Boolean(value && value.trim()),
  );

  return filtered.length > 0
    ? filtered.map((value) => `- ${value}`).join("\n")
    : "- 없음";
}

export function buildChatGptProAnalysisPrompt({
  project,
  hospital,
  benchmarks,
  summary,
}: Input) {
  const benchmarkRows = benchmarks
    .map(
      (item) => `
### Benchmark #${item.position}
- 제목: ${item.title}
- URL: ${item.canonicalUrl}
- 본문 길이: ${item.features.totalTextLength}자
- 이미지: ${item.features.imageCount}개
- Primary Keyword 정확 출현: ${item.features.exactKeywordCount}회
- 첫 300자 정확 출현: ${item.features.exactKeywordFirst300Count}회
- 제목 정확 키워드 포함: ${item.features.exactKeywordInTitle ? "예" : "아니오"}
- 문단: ${item.features.paragraphCount}개
- 평균 문단 길이: ${item.features.averageParagraphLength}자
- 질문부호: ${item.features.questionMarkCount}개
- 숫자 표현: ${item.features.numericExpressionCount}개
- 제목/목록/표: ${item.features.headingCount}/${item.features.listItemCount}/${item.features.tableCount}
`.trim(),
    )
    .join("\n\n");

  const confirmedFacts = hospital.facts
    .filter(
      (fact) =>
        fact.status === "CONFIRMED" ||
        fact.status === "VERIFIED",
    )
    .map(
      (fact) =>
        `${fact.category}/${fact.factKey}: ${fact.value}${
          fact.evidenceLabel
            ? ` (근거: ${fact.evidenceLabel})`
            : ""
        }`,
    );

  const services = hospital.serviceOfferings
    .filter(
      (service) =>
        service.status === "CONFIRMED",
    )
    .map(
      (service) =>
        `${service.title}: ${service.detail}`,
    );

  const claims = hospital.brandClaims.map(
    (claim) =>
      `${claim.claim} [병원 제공 상태: ${claim.factStatus}, 광고/컴플라이언스: ${claim.complianceStatus}]`,
  );

  const ctas = hospital.ctas
    .filter((cta) => cta.isActive)
    .map(
      (cta) =>
        `${cta.priority}. ${cta.label}: ${
          cta.value || cta.url || ""
        }`,
    );

  const sources = hospital.sources
    .filter(
      (source) =>
        source.status !== "DISABLED",
    )
    .map(
      (source) =>
        `${source.label} (${source.kind})${
          source.url ? `: ${source.url}` : ""
        } [${source.status}]`,
    );

  return `# 역할

당신은 한국 병원 네이버 블로그 콘텐츠를 연구·기획하는 시니어 콘텐츠 전략가다.
아래 데이터는 우리 내부 도구가 현재 Naver 통합검색에서 실제 노출된 Naver Blog 문서를 수집하고 deterministic feature를 계산한 결과다.

중요:
- 이 데이터의 패턴을 "네이버 순위 원인"이나 비공개 알고리즘으로 단정하지 않는다.
- 통합검색에 현재 관찰된 콘텐츠 패턴으로만 표현한다.
- 의료 정보는 별도 신뢰 가능한 근거를 웹 검색으로 확인한다.
- 병원 관련 사실은 아래 Hospital Evidence 범위만 사용하고, 확인되지 않은 사실은 추정하지 않는다.
- Brand Claim은 병원이 사용하고 싶은 표현일 뿐이다. complianceStatus가 ALLOWED가 아니면 그대로 발행 문구로 확정하지 않는다.
- 지금은 최종 원고를 바로 쓰지 않는다. 먼저 검색 의도, 콘텐츠 구조, 정보 공백, 의료 근거, 병원 근거, 인터뷰 질문을 정리한다.

# 프로젝트

- 병원: ${hospital.name}
- Primary Keyword: ${project.primaryKeyword}
- Secondary Keywords: ${
    project.secondaryKeywords.length > 0
      ? project.secondaryKeywords.join(", ")
      : "없음"
  }
- 검색 기준: ${project.devicePreference}
- 현재 Workflow: ${project.workflowStage}
- Benchmark 표본: ${summary.count}개 (${summary.sampleAdequacy})
- 통합검색 실제 노출 문서만 사용

# Benchmark Aggregate

- 본문 길이: 중앙값 ${summary.textLengthMedian}자 / 범위 ${summary.textLengthMin}~${summary.textLengthMax}자
- 이미지: 중앙값 ${summary.imageCountMedian}개 / 범위 ${summary.imageCountMin}~${summary.imageCountMax}개
- Primary Keyword 정확 출현: 중앙값 ${summary.keywordCountMedian}회 / 범위 ${summary.keywordCountMin}~${summary.keywordCountMax}회
- 제목에 정확 키워드 포함: ${summary.titleKeywordMatchCount}/${summary.count}

주의: 위 수치는 관찰 통계이며 목표 횟수나 최적값이 아니다.

# Benchmark Documents

${benchmarkRows}

# Hospital Profile

## 기본
- 병원명: ${hospital.name}
- 영문명: ${hospital.englishName || "없음"}
- 주소: ${hospital.address || "없음"}
- 전화: ${hospital.phone || "없음"}
- 개원일: ${hospital.openedOn || "없음"}
- 요약: ${hospital.summary || "없음"}
- 철학: ${hospital.philosophy || "없음"}

## 공식/확인 출처
${bullet(sources)}

## 확정된 Hospital Facts
${bullet(confirmedFacts)}

## 공식 진료/예약 서비스
${bullet(services)}

## 진료 분야
${bullet(
  hospital.specialties.map(
    (specialty) =>
      `${specialty.name}${
        specialty.isMarketingPriority
          ? " [마케팅 우선]"
          : ""
      }`,
  ),
)}

## Brand Claims — 그대로 사용 금지, 별도 검토
${bullet(claims)}

## CTA 우선순위
${bullet(ctas)}

# 현재 단계에서 해야 할 일

웹 검색을 사용해 현재 시점 자료를 검증하고 아래 순서로 진행하라.

1. **Search Intent / Content Archetype**
   - Primary Keyword의 검색 의도를 1차/2차로 분류.
   - 현재 Benchmark 문서가 공통적으로 해결하는 질문과 불안을 정리.
   - 추천 콘텐츠 archetype 1개와 대안 1개를 제시하고 이유를 설명.
   - 고정된 병원 말투를 강요하지 말고 이 키워드와 상위 문서 패턴에 맞는 Tone을 추천.

2. **Benchmark Pattern**
   - 제목, 도입부, 본문 구조, 질문 사용, 숫자/근거, 이미지 배치, CTA 흐름의 공통점.
   - 단순 평균이 아니라 반복되는 패턴 / 예외 / 과포화된 표현을 구분.
   - 경쟁 문서를 베끼지 않고 더 유용하게 만들 수 있는 정보 공백과 독창적 각도를 찾는다.

3. **Blog Context 준비**
   - 이 글을 쓰기 전에 공식 블로그의 최근 포스팅에서 확인해야 할 항목을 제시.
   - 아직 Blog Context 데이터가 제공되지 않았으므로 존재한다고 가정하지 않는다.

4. **Medical Evidence**
   - 일반 의료 주장은 한국 정부·공공기관, 국내 학회/가이드라인을 우선 검색.
   - 필요하면 국제 가이드라인/peer-reviewed까지 확장.
   - 각 핵심 주장마다 source title / institution / URL / 요약 / 충돌 여부를 정리.
   - 병원 자체 정보와 일반 의학 정보를 섞지 않는다.

5. **Hospital Evidence Mapping**
   - 이번 Keyword에 실제로 사용할 가치가 있는 확정 Hospital Fact만 연결.
   - 확인되지 않았거나 광고 리스크가 있는 Brand Claim은 별도로 표시.
   - 필요한 병원 사실이 없으면 "확인 필요"로 둔다.

6. **Adaptive Interview**
   - 위 분석 후 글 품질을 가장 크게 높이는 미확인 질문만 3~5개 제시.
   - 각 질문마다 "왜 필요한지"를 한 줄로 설명.
   - 답변 옵션은 가능하면:
     직접 입력 / 모름 / 병원 확인 필요 / 이번 글에서 제외 / 해당 없음
   - 이미 Hospital Profile에서 확인된 질문은 다시 묻지 않는다.

7. **READY TO WRITE 판정**
   - 아래를 각각 확인:
     Search Intent
     Benchmark Pattern
     Blog Context
     Medical Evidence
     Hospital Evidence
     중요 미확인 정보
   - 하나라도 중요한 공백이 있으면 READY가 아니라 NEEDS_MORE_INFO.
   - READY가 아니라면 최종 원고를 쓰지 않는다.

# 출력 형식

## 1. 검색 의도
## 2. 추천 콘텐츠 Archetype / Tone
## 3. Benchmark에서 관찰된 패턴
## 4. 경쟁 콘텐츠의 정보 공백
## 5. Medical Evidence
## 6. 이번 글에 사용할 Hospital Evidence
## 7. 사용 보류/검토 필요한 Brand Claim
## 8. Adaptive Interview 질문 3~5개
## 9. READY TO WRITE 상태
## 10. 다음 행동

불확실한 내용은 명확히 "확인 필요"라고 표시하라.
`;
}
