import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { BenchmarkCandidateSelector } from "@/components/serp/benchmark-candidate-selector";
import { ActionSubmitButton } from "@/components/ui/action-submit-button";
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

function StepCard({
  number,
  title,
  description,
  state,
}: {
  number: number;
  title: string;
  description: string;
  state: "DONE" | "CURRENT" | "NEXT";
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        state === "DONE"
          ? "border-emerald-200 bg-emerald-50/60"
          : state === "CURRENT"
            ? "border-blue-200 bg-blue-50/60"
            : "bg-muted/20",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            "flex size-6 items-center justify-center rounded-full text-xs font-bold",
            state === "DONE"
              ? "bg-emerald-600 text-white"
              : state === "CURRENT"
                ? "bg-blue-600 text-white"
                : "bg-slate-200 text-slate-700",
          ].join(" ")}
        >
          {number}
        </span>
        <strong className="text-sm">
          {title}
        </strong>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

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

  const legacySnapshot =
    Boolean(primarySnapshot) &&
    primarySnapshot!.candidates.some(
      (candidate) =>
        !candidate.sectionKind ||
        !candidate.sourceName,
    );

  const step1State = primarySnapshot
    ? "DONE"
    : "CURRENT";
  const step2State = summary
    ? "DONE"
    : primarySnapshot
      ? "CURRENT"
      : "NEXT";
  const step3State = summary
    ? "CURRENT"
    : "NEXT";

  return (
    <PageShell
      title={`${project.primaryKeyword} 분석`}
      description="Naver 통합검색의 실제 Naver Blog 노출 → Benchmark 분석 → ChatGPT Pro 작업 프롬프트 순서로 진행합니다."
    >
      <section className="grid gap-3 lg:grid-cols-3">
        <StepCard
          number={1}
          title="통합검색 Blog 수집"
          description="현재 통합검색에 실제 노출된 Naver Blog 문서를 가져옵니다."
          state={step1State}
        />
        <StepCard
          number={2}
          title="Benchmark 분석"
          description="관련 문서를 선택하고 본문·이미지·키워드 패턴을 파싱합니다."
          state={step2State}
        />
        <StepCard
          number={3}
          title="ChatGPT Pro 프롬프트"
          description="분석 결과와 Hospital Profile을 묶어 다음 단계 연구 프롬프트를 만듭니다."
          state={step3State}
        />
      </section>

      {query.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {query.error}
        </div>
      ) : null}

      {query.searched ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          Naver 통합검색에서 실제 Blog 게시글{" "}
          {query.searched}개를 수집했습니다. 아래 제목과
          출처를 확인한 뒤 Benchmark를 선택하세요.
        </div>
      ) : null}

      {query.imported ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          Benchmark {query.imported}개 분석이 완료됐습니다.
          아래 분석 결과를 확인한 뒤 ChatGPT Pro
          프롬프트 단계로 이동할 수 있습니다.
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
        <section className="grid gap-4 rounded-xl border border-blue-200 bg-blue-50/30 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                  STEP 1
                </span>
                <h2 className="font-semibold">
                  Naver 통합검색 Blog 수집
                </h2>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Primary Keyword{" "}
                <strong className="text-foreground">
                  {project.primaryKeyword}
                </strong>
                로 현재 Naver 통합검색을 조회하고 실제
                Naver Blog 게시글만 DOM 순서대로 저장합니다.
              </p>
            </div>

            <form action={searchNaverSerpAction}>
              <input
                type="hidden"
                name="projectId"
                value={project.id}
              />
              <ActionSubmitButton
                idleLabel={
                  primarySnapshot
                    ? "현재 통합검색 다시 수집"
                    : "Naver 통합검색 Blog 찾기"
                }
                pendingLabel="Naver 통합검색 수집 중..."
                tone="blue"
              />
            </form>
          </div>

          <p className="rounded-lg bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
            실행 중에는 버튼에 회전 아이콘과 상태 문구가
            표시됩니다. 별도 블로그탭/VIEW 결과를 섞지
            않습니다.
          </p>
        </section>
      ) : null}

      {primarySnapshot ? (
        <section className="grid gap-4 rounded-xl border p-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                STEP 2
              </span>
              <h2 className="font-semibold">
                Benchmark 후보 선택
              </h2>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
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
                className="mt-2 inline-block text-xs text-blue-700 underline underline-offset-4"
              >
                실제 통합검색 URL 열기
              </a>
            ) : null}
          </div>

          {primarySnapshot.candidates.length > 0 ? (
            <BenchmarkCandidateSelector
              projectId={project.id}
              snapshotId={primarySnapshot.id}
              legacySnapshot={legacySnapshot}
              candidates={primarySnapshot.candidates.map(
                (candidate) => ({
                  id: candidate.id,
                  rank: candidate.rank,
                  title: candidate.title,
                  snippet: candidate.snippet,
                  sourceName: candidate.sourceName,
                  url: candidate.url,
                  origin: candidate.origin,
                  included: candidate.included,
                  sectionKind:
                    candidate.sectionKind,
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
            STEP 1의 파란 버튼부터 실행하세요.
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
      ) : (
        <>
          {summary.sampleAdequacy === "LIMITED" ? (
            <section className="rounded-xl border border-amber-500/30 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              Benchmark {summary.count}개로 권장 표본
              5개보다 적습니다. 통합검색 실제 노출만
              사용한다는 원칙을 우선해 분석하지만 중앙값과
              범위는 제한 표본으로 해석해야 합니다.
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
              {summary.keywordCountMax}회. 순위 원인이나
              권장 반복 횟수를 의미하지 않습니다.
            </p>
          </section>

          <section className="grid gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Benchmark Article Features
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                실제 선택한 Blog 원문을 다시 파싱한
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
                    className="text-sm text-blue-700 underline underline-offset-4"
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

          <section className="grid gap-4 rounded-xl border border-violet-200 bg-violet-50/40 p-5">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                  STEP 3
                </span>
                <h2 className="font-semibold">
                  ChatGPT Pro 프롬프트
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                현재 Benchmark 분석과 Hospital Profile을
                묶은 다음 단계 분석 프롬프트를 바로 만들 수
                있습니다.
              </p>
            </div>

            <Link
              href={`/projects/${project.id}/prompt`}
              className="w-fit rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              ChatGPT Pro 프롬프트 만들기
            </Link>
          </section>
        </>
      )}
    </PageShell>
  );
}
