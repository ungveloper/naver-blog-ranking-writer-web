import { PageShell } from "@/components/app/page-shell";
import { calculateContentFitScore, calculateSourceContextScore } from "@/lib/analysis/scoring";

const contentFit = calculateContentFitScore({
  searchIntentFit: 92,
  informationCompleteness: 84,
  benchmarkPatternCoverage: 88,
  evidenceStrength: 90,
  hospitalUniqueInformation: 76,
  readability: 91,
  ctaFit: 80,
});

const sourceContext = calculateSourceContextScore({
  topicFocus: 88,
  relatedContentAccumulation: 84,
  recentActivity: 78,
  postingConsistency: 81,
  contentDepth: 86,
  publicEngagement: 70,
});

export default function AnalysisPage() {
  return (
    <PageShell
      title="분석 결과 예시"
      description="현재는 화면/점수 계약을 검증하기 위한 데모입니다. 실제 데이터는 Parser, SERP Provider, Supabase 연결 후 대체됩니다."
    >
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border p-5">
          <p className="text-xs font-medium text-muted-foreground">Content Fit Score</p>
          <p className="mt-2 text-4xl font-semibold">{contentFit}</p>
          <p className="mt-2 text-sm text-muted-foreground">READY TO WRITE 기본 기준: 85</p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-xs font-medium text-muted-foreground">Source Context Score</p>
          <p className="mt-2 text-4xl font-semibold">{sourceContext}</p>
          <p className="mt-2 text-sm text-muted-foreground">네이버 공식 점수가 아닌 내부 관찰 지표</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          ["Search Intent", "병원 탐색 + 정보 탐색 혼합"],
          ["Benchmark", "7개 문서 기준"],
          ["Blog Context", "최근 20 + 관련 10 분석 예정"],
          ["Medical Evidence", "공식/학회/논문 조사 예정"],
          ["Hospital Evidence", "VERIFIED Fact만 사용"],
          ["Adaptive Interview", "3~5개 핵심 질문 / 라운드"],
        ].map(([title, value]) => (
          <div key={title} className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-2 text-sm font-medium">{value}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
