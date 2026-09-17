import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { listContentProjectsForUser } from "@/lib/projects/repository";
import {
  getDevicePreferenceLabel,
  getWorkflowStageLabel,
} from "@/lib/projects/labels";

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await listContentProjectsForUser(
    session.user.id,
  );

  return (
    <PageShell
      title="콘텐츠 프로젝트"
      description="한 프로젝트는 한 포스팅의 분석·작성 작업입니다. 같은 병원이라도 Primary Keyword마다 독립 프로젝트를 생성합니다."
    >
      <div className="flex justify-end">
        <Link
          href="/projects/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          새 프로젝트
        </Link>
      </div>

      {projects.length === 0 ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">
            아직 저장된 프로젝트가 없습니다.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            병원을 선택하고 첫 Primary Keyword 프로젝트를
            만들어보세요.
          </p>
        </section>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl border p-5 transition hover:bg-muted/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {project.hospitalName}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {project.primaryKeyword}
                  </h2>

                  {project.secondaryKeywords.length > 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Secondary ·{" "}
                      {project.secondaryKeywords.join(", ")}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border px-2.5 py-1">
                      {getDevicePreferenceLabel(
                        project.devicePreference,
                      )}
                    </span>
                    <span className="rounded-full border px-2.5 py-1">
                      {getWorkflowStageLabel(
                        project.workflowStage,
                      )}
                    </span>
                  </div>
                </div>

                <span className="text-sm text-muted-foreground">
                  프로젝트 열기 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
