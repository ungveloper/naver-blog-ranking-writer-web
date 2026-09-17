import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { getContentProjectForUser } from "@/lib/projects/repository";
import {
  getDevicePreferenceLabel,
  getWorkflowStageLabel,
} from "@/lib/projects/labels";

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function AnalysisPage({
  params,
}: Props) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await getContentProjectForUser(
    session.user.id,
    projectId,
  );

  if (!project) {
    notFound();
  }

  return (
    <PageShell
      title={`${project.primaryKeyword} 분석`}
      description="현재는 실제 프로젝트 메타데이터까지 연결된 상태입니다. Benchmark를 수집하기 전에는 Content Fit Score나 Source Context Score를 생성하지 않습니다."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-xs text-muted-foreground">병원</p>
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

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-dashed p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Content Fit Score
          </p>
          <p className="mt-2 text-4xl font-semibold">—</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Benchmark 분석 전에는 계산하지 않음
          </p>
        </div>

        <div className="rounded-xl border border-dashed p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Source Context Score
          </p>
          <p className="mt-2 text-4xl font-semibold">—</p>
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
          다음 단계에서 Naver Blog URL을 실제로 수집·파싱하고,
          사용자가 Benchmark 5~10개를 확정한 뒤 Article
          Analysis로 넘어갑니다. 이 페이지에는 데모 점수를
          표시하지 않습니다.
        </p>
      </section>
    </PageShell>
  );
}
