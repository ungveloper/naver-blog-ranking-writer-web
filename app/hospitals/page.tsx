import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";

export default function HospitalsPage() {
  return (
    <PageShell
      title="병원"
      description="Hospital은 반복 사용하는 병원 고유 정보와 검증 근거를 저장하는 독립 Entity입니다. 하나의 병원 아래 여러 콘텐츠 프로젝트를 생성합니다."
    >
      <div className="flex justify-end">
        <Link href="/hospitals/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          병원 등록
        </Link>
      </div>

      <section className="rounded-xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">청맥병원</h2>
            <p className="mt-1 text-sm text-muted-foreground">첫 테스트 Hospital Profile · 실제 게시 전 검증용</p>
          </div>
          <span className="rounded-full border px-2.5 py-1 text-xs">TEST</span>
        </div>
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-muted p-3">공식 Source 조사 예정</div>
          <div className="rounded-lg bg-muted p-3">Hospital Fact 검증 예정</div>
          <div className="rounded-lg bg-muted p-3">CTA / 반복 문구 저장 예정</div>
        </div>
      </section>
    </PageShell>
  );
}
