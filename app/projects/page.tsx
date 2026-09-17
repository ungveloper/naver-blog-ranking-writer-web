import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";

export default function ProjectsPage() {
  return (
    <PageShell
      title="콘텐츠 프로젝트"
      description="프로젝트는 병원과 분리되며, 매 포스팅마다 Primary Keyword를 새로 입력해 독립 분석합니다."
    >
      <div className="flex justify-end">
        <Link href="/projects/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          새 프로젝트
        </Link>
      </div>
      <section className="rounded-xl border p-5 text-sm text-muted-foreground">
        아직 저장된 프로젝트가 없습니다. 다음 Phase에서 Supabase와 연결합니다.
      </section>
    </PageShell>
  );
}
