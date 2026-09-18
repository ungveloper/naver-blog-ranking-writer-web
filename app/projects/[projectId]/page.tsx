import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { getContentProjectForUser } from "@/lib/projects/repository";
import {
  getDevicePreferenceLabel,
  getWorkflowStageLabel,
} from "@/lib/projects/labels";
import { WORKFLOW_STAGES } from "@/lib/workflow/state";

type Props = {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    created?: string;
  }>;
};

export default async function ContentProjectPage({
  params,
  searchParams,
}: Props) {
  const session = await requireSession();
  const { projectId } = await params;
  const { created } = await searchParams;
  const project = await getContentProjectForUser(
    session.user.id,
    projectId,
  );

  if (!project) {
    notFound();
  }

  const currentStageIndex = WORKFLOW_STAGES.indexOf(
    project.workflowStage,
  );

  return (
    <PageShell
      title={project.primaryKeyword}
      description={`${project.hospitalName} 콘텐츠 프로젝트 · Keyword별 독립 분석 Workflow`}
    >
      {created ? (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          콘텐츠 프로젝트가 생성되었습니다. STEP 1
          통합검색 수집부터 시작하세요.
        </div>
      ) : null}

      <section className="grid gap-5 rounded-xl border p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              병원
            </p>
            <p className="mt-1 text-sm font-medium">
              {project.hospitalName}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              검색 기준
            </p>
            <p className="mt-1 text-sm font-medium">
              {getDevicePreferenceLabel(
                project.devicePreference,
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              현재 단계
            </p>
            <p className="mt-1 text-sm font-medium">
              {getWorkflowStageLabel(
                project.workflowStage,
              )}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Primary Keyword
          </p>
          <p className="mt-1 text-xl font-semibold">
            {project.primaryKeyword}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Secondary Keywords
          </p>
          {project.secondaryKeywords.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {project.secondaryKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border px-2.5 py-1 text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              없음
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            Workflow
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            완료된 단계와 현재 진행 중인 단계를 표시합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {WORKFLOW_STAGES.map((stage, index) => {
            const isCurrent =
              stage === project.workflowStage;
            const isCompleted =
              index < currentStageIndex;

            return (
              <span
                key={stage}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs",
                  isCurrent
                    ? "bg-blue-600 text-white"
                    : "",
                  isCompleted
                    ? "bg-emerald-50 text-emerald-800"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {getWorkflowStageLabel(stage)}
              </span>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">
            현재 작업
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            분석 화면에서 통합검색 Blog 후보를 수집하고
            Benchmark를 분석하세요. Benchmark 완료 후에는
            같은 화면에서 ChatGPT Pro 작업 프롬프트로
            이어집니다.
          </p>
        </div>

        <Link
          href={`/projects/${project.id}/analysis`}
          className="w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          분석 Workflow 열기
        </Link>
      </section>
    </PageShell>
  );
}
