import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { CopyPromptButton } from "@/components/prompt/copy-prompt-button";
import { BenchmarkCandidateSelector } from "@/components/serp/benchmark-candidate-selector";
import { ActionSubmitButton } from "@/components/ui/action-submit-button";
import { searchNaverSerpAction } from "@/app/projects/[projectId]/analysis/actions";
import { requireSession } from "@/lib/auth-session";
import {
  listBenchmarksForProject,
  summarizeBenchmarks,
} from "@/lib/benchmarks/repository";
import { getHospitalProfileForUser } from "@/lib/hospitals/repository";
import { buildChatGptProAnalysisPrompt } from "@/lib/prompts/chatgpt-pro";
import { getDevicePreferenceLabel } from "@/lib/projects/labels";
import { getContentProjectForUser } from "@/lib/projects/repository";
import { getLatestSerpSnapshotsForProject } from "@/lib/serp/repository";

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    step?: string;
    error?: string;
    imported?: string;
    searched?: string;
  }>;
};

type WizardStep = 1 | 2 | 3;

function resolveStep(
  requested: string | undefined,
  hasSnapshot: boolean,
  hasAnalysis: boolean,
): WizardStep {
  if (requested === "3" && hasAnalysis) return 3;
  if (requested === "2" && hasSnapshot) return 2;
  if (requested === "1") return 1;
  if (hasAnalysis) return 3;
  if (hasSnapshot) return 2;
  return 1;
}

function WizardNav({
  projectId,
  current,
  hasSnapshot,
  hasAnalysis,
}: {
  projectId: string;
  current: WizardStep;
  hasSnapshot: boolean;
  hasAnalysis: boolean;
}) {
  const steps = [
    {
      id: 1 as const,
      title: "통합검색 수집",
      desc: "실제 Naver Blog 노출 수집",
      available: true,
      done: hasSnapshot,
    },
    {
      id: 2 as const,
      title: "Benchmark",
      desc: "선택 · 원문 파싱 · 분석",
      available: hasSnapshot,
      done: hasAnalysis,
    },
    {
      id: 3 as const,
      title: "분석 & Prompt",
      desc: "결과 확인 · ChatGPT Pro",
      available: hasAnalysis,
      done: false,
    },
  ];

  return (
    <div className="grid border-b bg-muted/20 md:grid-cols-3">
      {steps.map((step) => {
        const active = current === step.id;
        const inner = (
          <div className="flex items-center gap-3">
            <span
              className={[
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                active
                  ? "bg-blue-600 text-white"
                  : step.done
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600",
              ].join(" ")}
            >
              {step.done && !active ? "✓" : step.id}
            </span>
            <div>
              <p className={active ? "text-sm font-semibold text-blue-700" : "text-sm font-semibold"}>
                {step.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        );

        if (!step.available) {
          return (
            <div key={step.id} className="border-b p-4 opacity-50 md:border-b-0 md:border-r md:last:border-r-0">
              {inner}
            </div>
          );
        }

        return (
          <Link
            key={step.id}
            href={`/projects/${projectId}/analysis?step=${step.id}`}
            className={[
              "border-b p-4 transition hover:bg-background/70 md:border-b-0 md:border-r md:last:border-r-0",
              active ? "bg-background shadow-[inset_0_-3px_0_0_rgb(37_99_235)]" : "",
            ].join(" ")}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

export default async function AnalysisPage({ params, searchParams }: Props) {
  const session = await requireSession();
  const { projectId } = await params;
  const query = await searchParams;

  const [project, benchmarks, serpSnapshots] = await Promise.all([
    getContentProjectForUser(session.user.id, projectId),
    listBenchmarksForProject(session.user.id, projectId),
    getLatestSerpSnapshotsForProject(session.user.id, projectId),
  ]);

  if (!project) notFound();

  const summary = summarizeBenchmarks(benchmarks);
  const canEdit = project.hospitalRole === "OWNER" || project.hospitalRole === "EDITOR";
  const primaryDevice = project.devicePreference === "DESKTOP" ? "DESKTOP" : "MOBILE";
  const primarySnapshot = serpSnapshots.find((snapshot) => snapshot.device === primaryDevice);
  const hasSnapshot = Boolean(primarySnapshot);
  const hasAnalysis = Boolean(summary);
  const currentStep = resolveStep(query.step, hasSnapshot, hasAnalysis);

  const legacySnapshot =
    Boolean(primarySnapshot) &&
    primarySnapshot!.candidates.some(
      (candidate) => !candidate.sectionKind || !candidate.sourceName,
    );

  const hospital = summary
    ? await getHospitalProfileForUser(session.user.id, project.hospitalId)
    : null;

  const prompt = summary && hospital
    ? buildChatGptProAnalysisPrompt({ project, hospital, benchmarks, summary })
    : null;

  const referenceCharacters = benchmarks.reduce(
    (sum, item) => sum + Array.from(item.contentText || "").length,
    0,
  );

  return (
    <PageShell
      title={`${project.primaryKeyword} 분석`}
      description={`${project.hospitalName} · ${getDevicePreferenceLabel(project.devicePreference)} · 하나의 Step Wizard에서 수집부터 ChatGPT Pro Prompt까지 진행`}
    >
      <section className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <WizardNav
          projectId={project.id}
          current={currentStep}
          hasSnapshot={hasSnapshot}
          hasAnalysis={hasAnalysis}
        />

        <div className="grid gap-6 p-5 md:p-6">
          {query.error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {query.error}
            </div>
          ) : null}

          {currentStep === 1 ? (
            <>
              <div>
                <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">STEP 1</span>
                <h2 className="mt-3 text-xl font-semibold">Naver 통합검색 Blog 수집</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Primary Keyword <strong className="text-foreground">{project.primaryKeyword}</strong>로 현재 Naver 통합검색을 조회하고 실제 Naver Blog 게시글만 DOM 노출 순서대로 저장합니다.
                </p>
              </div>

              <div className="grid gap-4 rounded-xl border bg-blue-50/40 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-medium">검색 기준</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getDevicePreferenceLabel(project.devicePreference)} · 별도 블로그탭/VIEW 결과를 섞지 않음
                  </p>
                </div>

                {canEdit ? (
                  <form action={searchNaverSerpAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <ActionSubmitButton
                      idleLabel={primarySnapshot ? "현재 통합검색 다시 수집" : "Naver 통합검색 Blog 찾기"}
                      pendingLabel="Naver 통합검색 수집 중..."
                      tone="blue"
                    />
                  </form>
                ) : null}
              </div>

              {primarySnapshot ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
                  <div>
                    <p className="font-semibold">최근 수집 완료</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      실제 Blog 노출 {primarySnapshot.candidates.length}개 · {new Date(primarySnapshot.capturedAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <Link
                    href={`/projects/${project.id}/analysis?step=2`}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    STEP 2 Benchmark로 이동
                  </Link>
                </div>
              ) : null}
            </>
          ) : null}

          {currentStep === 2 && primarySnapshot ? (
            <>
              <div>
                <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">STEP 2</span>
                <h2 className="mt-3 text-xl font-semibold">Benchmark 선택 및 분석</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  실제 통합검색 Blog 후보에서 관련 문서만 선택합니다. 선택 후 원문을 다시 파싱해 본문·이미지·키워드 Feature를 저장합니다.
                </p>
              </div>

              {query.searched ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                  통합검색 Blog 후보 {query.searched}개를 수집했습니다. 아래에서 최종 Benchmark를 선택하세요.
                </div>
              ) : null}

              <BenchmarkCandidateSelector
                projectId={project.id}
                snapshotId={primarySnapshot.id}
                legacySnapshot={legacySnapshot}
                candidates={primarySnapshot.candidates.map((candidate) => ({
                  id: candidate.id,
                  rank: candidate.rank,
                  title: candidate.title,
                  snippet: candidate.snippet,
                  sourceName: candidate.sourceName,
                  thumbnailUrl: candidate.thumbnailUrl,
                  url: candidate.url,
                  origin: candidate.origin,
                  included: candidate.included,
                  sectionKind: candidate.sectionKind,
                }))}
              />
            </>
          ) : null}

          {currentStep === 3 && summary ? (
            <>
              <div>
                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white">STEP 3</span>
                <h2 className="mt-3 text-xl font-semibold">Benchmark 분석 결과 & ChatGPT Pro</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  분석 결과를 확인하고, 선택한 Reference Blog 원문 전문과 Hospital Profile을 포함한 ChatGPT Pro 분석 Prompt를 복사합니다.
                </p>
              </div>

              {query.imported ? (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
                  Benchmark {query.imported}개 분석이 완료됐습니다.
                </div>
              ) : null}

              {summary.sampleAdequacy === "LIMITED" ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  현재 Benchmark는 {summary.count}개로 권장 표본 5개보다 적습니다. 통합검색 실제 노출만 사용한다는 원칙을 우선하며 집계는 제한 표본으로 해석합니다.
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Benchmark" value={String(summary.count)} />
                <Metric
                  label="본문 길이 중앙값"
                  value={summary.textLengthMedian.toLocaleString()}
                  sub={`${summary.textLengthMin.toLocaleString()}~${summary.textLengthMax.toLocaleString()}자`}
                />
                <Metric
                  label="이미지 중앙값"
                  value={String(summary.imageCountMedian)}
                  sub={`${summary.imageCountMin}~${summary.imageCountMax}개`}
                />
                <Metric
                  label="제목 정확 키워드"
                  value={`${summary.titleKeywordMatchCount}/${summary.count}`}
                />
              </div>

              <div className="grid gap-3">
                {benchmarks.map((benchmark) => (
                  <article key={benchmark.sourceDocumentId} className="grid gap-3 rounded-xl border p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Reference #{benchmark.position}</p>
                        <h3 className="mt-1 font-semibold">{benchmark.title}</h3>
                      </div>
                      <a
                        href={benchmark.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-700 underline underline-offset-4"
                      >
                        원문 열기
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span>본문 {benchmark.features.totalTextLength.toLocaleString()}자</span>
                      <span>이미지 {benchmark.features.imageCount}개</span>
                      <span>키워드 {benchmark.features.exactKeywordCount}회</span>
                      <span>문단 {benchmark.features.paragraphCount}개</span>
                      <span>질문 {benchmark.features.questionMarkCount}개</span>
                      <span>숫자 {benchmark.features.numericExpressionCount}개</span>
                    </div>
                  </article>
                ))}
              </div>

              {prompt ? (
                <section className="grid gap-4 rounded-xl border border-violet-200 bg-violet-50/40 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">ChatGPT Pro 다음 단계 분석 Prompt</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Reference {benchmarks.length}개의 파싱 본문 전문 약 <strong className="text-foreground">{referenceCharacters.toLocaleString()}자</strong>와 이미지 위치 마커, 정량 Feature, Hospital Profile을 모두 포함합니다.
                      </p>
                    </div>
                    <CopyPromptButton text={prompt} />
                  </div>

                  <div className="grid gap-3 rounded-xl border bg-background/80 p-4">
                    <p className="text-sm font-semibold">프롬프트를 붙여넣은 뒤의 진행 순서</p>
                    <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-violet-200 bg-violet-50 p-3"><strong>(1/4) Reference 분석</strong><p className="mt-1 text-muted-foreground">현재 응답에서 수행</p></div>
                      <div className="rounded-lg border p-3"><strong>(2/4) 누락 정보 보완</strong><p className="mt-1 text-muted-foreground">질문·Blog Context만 보완</p></div>
                      <div className="rounded-lg border p-3"><strong>(3/4) Article Brief</strong><p className="mt-1 text-muted-foreground">제목·목차·근거·이미지·CTA 확정</p></div>
                      <div className="rounded-lg border p-3"><strong>(4/4) READY 판정</strong><p className="mt-1 text-muted-foreground">집필 가능 여부와 다음 이동 안내</p></div>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">ChatGPT가 한 번에 모든 할 일을 나열하지 않고, 매 응답 마지막에 현재 단계와 사용자가 지금 해야 할 일 하나를 구체적으로 안내하도록 구성했습니다.</p>
                  </div>

                  <textarea
                    readOnly
                    value={prompt}
                    rows={22}
                    className="w-full rounded-xl border bg-background p-4 font-mono text-xs leading-5 outline-none"
                  />

                  <p className="rounded-lg bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
                    Reference Benchmark 원문과 이후 Phase 6에서 수집할 청맥병원 공식 블로그 최근 포스팅 Blog Context는 서로 다른 데이터입니다. 최종 집필 Prompt는 Blog Context · Medical Evidence · Adaptive Interview까지 완료한 뒤 활성화합니다.
                  </p>
                </section>
              ) : null}

              <div className="flex flex-wrap gap-3 border-t pt-5">
                <Link href={`/projects/${project.id}/analysis?step=2`} className="rounded-md border px-4 py-2 text-sm font-medium">
                  Benchmark 선택으로 돌아가기
                </Link>
                <Link href={`/projects/${project.id}/analysis?step=1`} className="rounded-md border px-4 py-2 text-sm font-medium">
                  통합검색 다시 수집
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {sub ? <p className="mt-2 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
