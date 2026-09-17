import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { getContentProjectForUser } from "@/lib/projects/repository";
import {
  getDevicePreferenceLabel,
  getWorkflowStageLabel,
} from "@/lib/projects/labels";
import {
  listBenchmarksForProject,
  summarizeBenchmarks,
} from "@/lib/benchmarks/repository";
import { importManualBenchmarkAction } from "@/app/projects/[projectId]/analysis/actions";

type Props = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    imported?: string;
  }>;
};

const inputClassName =
  "rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40";

export default async function AnalysisPage({
  params,
  searchParams,
}: Props) {
  const session = await requireSession();
  const { projectId } = await params;
  const query = await searchParams;

  const [project, benchmarks] = await Promise.all([
    getContentProjectForUser(
      session.user.id,
      projectId,
    ),
    listBenchmarksForProject(
      session.user.id,
      projectId,
    ),
  ]);

  if (!project) {
    notFound();
  }

  const summary = summarizeBenchmarks(benchmarks);
  const canEdit =
    project.hospitalRole === "OWNER" ||
    project.hospitalRole === "EDITOR";

  return (
    <PageShell
      title={`${project.primaryKeyword} 분석`}
      description="Manual Benchmark Vertical Slice입니다. 실제 Naver Blog 글 5~10개를 서버에서 파싱하고 snapshot + deterministic Article Feature를 저장합니다."
    >
      {query.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {query.error}
        </div>
      ) : null}

      {query.imported ? (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          Benchmark {query.imported}개를 파싱하고 Article
          Feature snapshot을 저장했습니다.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-xs text-muted-foreground">
            병원
          </p>
          <p className="mt-2 font-semibold">
            {project.hospitalName}
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-xs text-muted-foreground">
            검색 기준
          </p>
          <p className="mt-2 font-semibold">
            {getDevicePreferenceLabel(
              project.devicePreference,
            )}
          </p>
        </div>
        <div className="rounded-xl border p-5">
          <p className="text-xs text-muted-foreground">
            Workflow
          </p>
          <p className="mt-2 font-semibold">
            {getWorkflowStageLabel(
              project.workflowStage,
            )}
          </p>
        </div>
      </section>

      {canEdit ? (
        <section className="grid gap-4 rounded-xl border p-5">
          <div>
            <h2 className="font-semibold">
              Manual Benchmark
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              현재 검색 결과에서 직접 고른 Naver Blog 글
              5~10개의 URL을 한 줄에 하나씩 입력하세요.
              다시 실행하면 현재 Benchmark set을 교체합니다.
            </p>
          </div>

          <form
            action={importManualBenchmarkAction}
            className="grid gap-4"
          >
            <input
              type="hidden"
              name="projectId"
              value={project.id}
            />

            <textarea
              name="urls"
              required
              rows={9}
              className={inputClassName}
              placeholder={
                "https://blog.naver.com/blogId/123456789\nhttps://m.blog.naver.com/blogId/987654321\n..."
              }
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                5~10개 파싱하고 Benchmark 저장
              </button>
              <p className="text-xs text-muted-foreground">
                서버에서 순차적으로 파싱하므로 글 수에 따라
                잠시 걸릴 수 있습니다.
              </p>
            </div>
          </form>
        </section>
      ) : null}

      {!summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-dashed p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Content Fit Score
              </p>
              <p className="mt-2 text-4xl font-semibold">
                —
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Benchmark 분석 전에는 계산하지 않음
              </p>
            </div>
            <div className="rounded-xl border border-dashed p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Source Context Score
              </p>
              <p className="mt-2 text-4xl font-semibold">
                —
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Blog Context 분석 전에는 계산하지 않음
              </p>
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="font-semibold">
              아직 Benchmark가 없습니다.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              위 입력창에 실제 Naver Blog URL 5~10개를
              넣으면 이 페이지에서 Article Pattern을 바로
              확인할 수 있습니다.
            </p>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                Benchmark
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {summary.count}
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                본문 길이 중앙값
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {summary.textLengthMedian.toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {summary.textLengthMin.toLocaleString()}~
                {summary.textLengthMax.toLocaleString()}자
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                이미지 중앙값
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {summary.imageCountMedian}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {summary.imageCountMin}~
                {summary.imageCountMax}개
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <p className="text-xs text-muted-foreground">
                제목 정확 키워드
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {summary.titleKeywordMatchCount}/
                {summary.count}
              </p>
            </div>
          </section>

          <section className="rounded-xl border p-5">
            <h2 className="font-semibold">
              Primary Keyword 출현 패턴
            </h2>
            <p className="mt-3 text-sm">
              본문 정확 출현 중앙값{" "}
              <strong>
                {summary.keywordCountMedian}회
              </strong>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              관찰 범위 {summary.keywordCountMin}~
              {summary.keywordCountMax}회. 이는 상위 문서에서
              관찰된 패턴이지 순위 원인이나 권장 반복 횟수를
              의미하지 않습니다.
            </p>
          </section>

          <section className="grid gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Benchmark Article Features
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                문서별 deterministic snapshot입니다.
              </p>
            </div>

            {benchmarks.map((benchmark) => (
              <article
                key={benchmark.sourceDocumentId}
                className="grid gap-4 rounded-xl border p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      #{benchmark.position}
                    </p>
                    <h3 className="mt-1 font-semibold">
                      {benchmark.title}
                    </h3>
                  </div>
                  <a
                    href={benchmark.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline underline-offset-4"
                  >
                    원문 열기
                  </a>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      본문
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.totalTextLength.toLocaleString()}
                      자
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      이미지
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.imageCount}개
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      정확 키워드
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.exactKeywordCount}회
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      제목 포함
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.exactKeywordInTitle
                        ? "예"
                        : "아니오"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      문단
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.paragraphCount}개
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      평균 문단
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.averageParagraphLength}자
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      질문부호
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.questionMarkCount}개
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      숫자 표현
                    </p>
                    <p className="mt-1 font-medium">
                      {benchmark.features.numericExpressionCount}개
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-3 rounded-xl border p-5">
            <h2 className="font-semibold">
              다음 연결 지점
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Article parser와 Manual Benchmark Vertical
              Slice까지 실제 데이터로 연결됐습니다. 다음
              단계에서는 Blog Context와 자동 SERP 후보 수집을
              이 snapshot 위에 연결합니다.
            </p>
          </section>
        </>
      )}
    </PageShell>
  );
}
