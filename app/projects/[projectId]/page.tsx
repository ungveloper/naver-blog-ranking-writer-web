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
      description={`${project.hospitalName} 콘텐츠 프로젝트 · Hospital Profile과 분리된 독립 분석 작업`}
    >
      {created ? (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          콘텐츠 프로젝트가 생성되었습니다. 병원/키워드 입력이
          끝났으므로 Workflow는 SERP 단계부터 시작합니다.
        </div>
      ) : null}

      <section className="grid gap-5 rounded-xl border p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">병원</p>
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
              {getWorkflowStageLabel(project.workflowStage)}
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
            HOSPITAL과 KEYWORD는 프로젝트 생성 시 완료된 것으로
            보고 SERP부터 다음 작업을 이어갑니다.
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
                    ? "bg-primary text-primary-foreground"
                    : "",
                  isCompleted
                    ? "bg-muted text-muted-foreground"
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
          <h2 className="font-semibold">다음 작업</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            다음 패치에서 Naver Blog Parser를 이식한 뒤 Manual
            Benchmark Vertical Slice를 연결합니다. 자동 SERP가
            없어도 실제 상위 글 URL을 입력해 분석 엔진부터 검증할
            수 있게 진행합니다.
          </p>
        </div>

        <Link
          href={`/projects/${project.id}/analysis`}
          className="w-fit rounded-md border px-4 py-2 text-sm font-medium"
        >
          분석 작업 화면 보기
        </Link>
      </section>
    </PageShell>
  );
}
