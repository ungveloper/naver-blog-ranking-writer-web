import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { BenchmarkCandidateSelector } from "@/components/serp/benchmark-candidate-selector";
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
import {
  getLatestSerpSnapshotsForProject,
} from "@/lib/serp/repository";
import { searchNaverSerpAction } from "@/app/projects/[projectId]/analysis/actions";

type Props = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    imported?: string;
    searched?: string;
  }>;
};

export default async function AnalysisPage({
  params,
  searchParams,
}: Props) {
  const session = await requireSession();
  const { projectId } = await params;
  const query = await searchParams;

  const [project, benchmarks, serpSnapshots] =
    await Promise.all([
      getContentProjectForUser(
        session.user.id,
        projectId,
      ),
      listBenchmarksForProject(
        session.user.id,
        projectId,
      ),
      getLatestSerpSnapshotsForProject(
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

  const primaryDevice =
    project.devicePreference === "DESKTOP"
      ? "DESKTOP"
      : "MOBILE";

  const primarySnapshot = serpSnapshots.find(
    (snapshot) => snapshot.device === primaryDevice,
  );

  const desktopReference =
    project.devicePreference === "BOTH"
      ? serpSnapshots.find(
          (snapshot) =>
            snapshot.device === "DESKTOP",
        )
      : null;

  return (
    <PageShell
      title={`${project.primaryKeyword} 분석`}
      description="Primary Keyword의 Naver 통합검색 안에서 실제로 노출된 Naver Blog 게시글만 DOM 순서대로 수집합니다. 별도 블로그탭 결과는 섞지 않습니다."
    >
      {query.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {query.error}
        </div>
      ) : null}

      {query.searched ? (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          Naver 통합검색에서 실제 Blog 게시글{" "}
          {query.searched}개를 수집했습니다.
        </div>
      ) : null}

      {query.imported ? (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          선택한 Benchmark {query.imported}개를 실제
          파싱하고 Article Feature snapshot을
          저장했습니다.
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">
                Naver 통합검색 Blog 상위 노출 수집
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                현재 Primary Keyword{" "}
                <strong className="text-foreground">
                  {project.primaryKeyword}
                </strong>
                로 Naver 통합검색을 직접 조회합니다.
                통합검색 HTML 안에서 실제 Naver Blog 게시글
                URL만 추리고 DOM 노출 순서대로 저장합니다.
              </p>
            </div>

            <form action={searchNaverSerpAction}>
              <input
                type="hidden"
                name="projectId"
                value={project.id}
              />
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {primarySnapshot
                  ? "현재 통합검색 다시 수집"
                  : "Naver 통합검색 Blog 찾기"}
              </button>
            </form>
          </div>

          <p className="rounded-lg bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
            블로그 검색탭·VIEW 결과를 보완용으로 섞지
            않습니다. 통합검색에 Blog 게시글이 4개만
            노출되면 4개가 현재 snapshot의 전체 표본입니다.
            5개 미만이면 제한 표본으로 분석합니다.
          </p>
        </section>
      ) : null}

      {primarySnapshot ? (
        <section className="grid gap-4 rounded-xl border p-5">
          <div>
            <h2 className="font-semibold">
              통합검색 Blog 후보
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {primarySnapshot.device === "MOBILE"
                ? "모바일"
                : "데스크탑"}{" "}
              snapshot ·{" "}
              {new Date(
                primarySnapshot.capturedAt,
              ).toLocaleString("ko-KR")}
              {" · "}
              실제 Blog 노출{" "}
              {primarySnapshot.candidates.length}개
            </p>

            {primarySnapshot.searchUrl ? (
              <a
                href={primarySnapshot.searchUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs underline underline-offset-4"
              >
                실제 통합검색 URL 열기
              </a>
            ) : null}
          </div>

          {primarySnapshot.candidates.length > 0 ? (
            <BenchmarkCandidateSelector
              projectId={project.id}
              snapshotId={primarySnapshot.id}
              candidates={primarySnapshot.candidates.map(
                (candidate) => ({
                  id: candidate.id,
                  rank: candidate.rank,
                  title: candidate.title,
                  url: candidate.url,
                  origin: candidate.origin,
                  included: candidate.included,
                }),
              )}
            />
          ) : (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm leading-6">
              현재 통합검색 snapshot에서 실제 Naver Blog
              게시글을 찾지 못했습니다.
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed p-6">
          <h2 className="font-semibold">
            아직 통합검색 snapshot이 없습니다.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            위 버튼을 누르면 Primary Keyword의 Naver
            통합검색을 직접 조회하고, 통합검색 안의 실제
            Naver Blog 게시글만 가져옵니다.
          </p>
        </section>
      )}

      {desktopReference &&
      primaryDevice === "MOBILE" ? (
        <section className="rounded-xl border p-5">
          <h2 className="font-semibold">
            데스크탑 통합검색 참고 snapshot
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            실제 Naver Blog 게시글{" "}
            {desktopReference.resultCount}개 · 모바일을
            주 기준으로 사용하고 데스크탑은 참고 비교용으로
            저장했습니다.
          </p>
        </section>
      ) : null}

      {!summary ? (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-dashed p-5">
            <p className="text-xs font-medium text-muted-foreground">
              Content Fit Score
            </p>
            <p className="mt-2 text-4xl font-semibold">
              —
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              최종 Benchmark 분석 전에는 계산하지 않음
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
      ) : (
        <>
          {summary.sampleAdequacy === "LIMITED" ? (
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6">
              현재 Benchmark는 {summary.count}개로 권장
              표본 5개보다 적습니다. 통합검색 실제 노출만
              사용한다는 원칙을 우선해 분석은 진행하지만,
              중앙값·범위 등 집계 결과는 제한 표본으로
              해석해야 합니다.
            </section>
          ) : null}

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
              {summary.keywordCountMax}회. 현재 통합검색
              노출 문서에서 관찰된 패턴이며 순위 원인이나
              권장 반복 횟수를 의미하지 않습니다.
            </p>
          </section>

          <section className="grid gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Benchmark Article Features
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                통합검색에서 실제 노출된 Naver Blog 글의
                deterministic snapshot입니다.
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
                      {benchmark.features.averageParagraphLength}
                      자
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
                      {benchmark.features.numericExpressionCount}
                      개
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </PageShell>
  );
}
