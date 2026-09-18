import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { CopyPromptButton } from "@/components/prompt/copy-prompt-button";
import { requireSession } from "@/lib/auth-session";
import {
  listBenchmarksForProject,
  summarizeBenchmarks,
} from "@/lib/benchmarks/repository";
import { getHospitalProfileForUser } from "@/lib/hospitals/repository";
import { getContentProjectForUser } from "@/lib/projects/repository";
import { buildChatGptProAnalysisPrompt } from "@/lib/prompts/chatgpt-pro";
import { WORKFLOW_STAGES } from "@/lib/workflow/state";

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

function reachedStage(
  current: (typeof WORKFLOW_STAGES)[number],
  target: (typeof WORKFLOW_STAGES)[number],
) {
  return (
    WORKFLOW_STAGES.indexOf(current) >=
    WORKFLOW_STAGES.indexOf(target)
  );
}

export default async function PromptPage({
  params,
}: Props) {
  const session = await requireSession();
  const { projectId } = await params;

  const project =
    await getContentProjectForUser(
      session.user.id,
      projectId,
    );

  if (!project) {
    notFound();
  }

  const [hospital, benchmarks] =
    await Promise.all([
      getHospitalProfileForUser(
        session.user.id,
        project.hospitalId,
      ),
      listBenchmarksForProject(
        session.user.id,
        project.id,
      ),
    ]);

  if (!hospital) {
    notFound();
  }

  const summary =
    summarizeBenchmarks(benchmarks);

  if (!summary) {
    return (
      <PageShell
        title="ChatGPT Pro 프롬프트"
        description="Benchmark 분석이 먼저 필요합니다."
      >
        <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-5">
          <h2 className="font-semibold">
            Benchmark 분석이 아직 없습니다.
          </h2>
          <p className="mt-2 text-sm leading-6">
            통합검색 후보를 선택하고 Benchmark 분석을
            완료한 뒤 이 화면에서 프롬프트를 만들 수
            있습니다.
          </p>
          <Link
            href={`/projects/${project.id}/analysis`}
            className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Benchmark 분석으로 돌아가기
          </Link>
        </div>
      </PageShell>
    );
  }

  const prompt =
    buildChatGptProAnalysisPrompt({
      project,
      hospital,
      benchmarks,
      summary,
    });

  const finalWriterReady =
    reachedStage(
      project.workflowStage,
      "READY_TO_WRITE",
    );

  return (
    <PageShell
      title="ChatGPT Pro 작업 프롬프트"
      description={`${project.primaryKeyword} · Benchmark 이후의 검색 의도/근거/인터뷰 단계를 ChatGPT Pro에서 이어가기 위한 프롬프트`}
    >
      <section className="grid gap-3 rounded-xl border p-5">
        <h2 className="font-semibold">
          현재 가능한 프롬프트
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Benchmark 분석은 완료됐지만 최종 집필 전
          단계인 Blog Context, Medical Evidence,
          Hospital Evidence, Adaptive Interview가 아직
          남아 있습니다. 그래서 지금은{" "}
          <strong className="text-foreground">
            다음 단계 분석용 ChatGPT Pro 프롬프트
          </strong>
          를 제공합니다.
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-600 px-3 py-1.5 font-semibold text-white">
            Benchmark 완료
          </span>
          <span className="rounded-full border px-3 py-1.5">
            Blog Context 예정
          </span>
          <span className="rounded-full border px-3 py-1.5">
            Medical Evidence 예정
          </span>
          <span className="rounded-full border px-3 py-1.5">
            Adaptive Interview 예정
          </span>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-violet-200 bg-violet-50/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">
              ChatGPT Pro 다음 단계 분석 프롬프트
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Benchmark 수치, 실제 원문 URL, 병원 공식
              Profile/Fact/CTA를 패키징했습니다. 복사해서
              ChatGPT Pro의 새 채팅에 그대로 넣으면 됩니다.
            </p>
          </div>

          <CopyPromptButton text={prompt} />
        </div>

        <textarea
          readOnly
          value={prompt}
          rows={26}
          className="w-full rounded-xl border bg-background p-4 font-mono text-xs leading-5 outline-none"
        />
      </section>

      <section className="grid gap-3 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">
              최종 집필 프롬프트
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              앱 내부 READY TO WRITE gate를 통과한 뒤
              활성화되는 최종 원고용 프롬프트입니다.
            </p>
          </div>

          <span
            className={[
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              finalWriterReady
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 text-slate-700",
            ].join(" ")}
          >
            {finalWriterReady
              ? "READY"
              : "아직 잠김"}
          </span>
        </div>

        {!finalWriterReady ? (
          <p className="rounded-lg bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
            최종 집필 프롬프트를 성급하게 만들면 의료
            근거와 병원 사실이 빠질 수 있으므로 지금은
            활성화하지 않습니다. 이후 Phase 6~9를 앱에
            연결하면서 자동 활성화합니다.
          </p>
        ) : null}
      </section>

      <Link
        href={`/projects/${project.id}/analysis`}
        className="w-fit rounded-md border px-4 py-2 text-sm font-medium"
      >
        Benchmark 분석으로 돌아가기
      </Link>
    </PageShell>
  );
}
