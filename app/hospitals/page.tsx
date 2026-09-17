import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { listHospitalsForUser } from "@/lib/hospitals/repository";

export default async function HospitalsPage() {
  const session = await requireSession();
  const hospitals = await listHospitalsForUser(session.user.id);

  return (
    <PageShell
      title="병원"
      description="Hospital은 반복 사용하는 병원 고유 정보와 검증 근거를 저장하는 독립 Entity입니다. 하나의 병원 아래 여러 콘텐츠 프로젝트를 생성합니다."
    >
      <div className="flex justify-end">
        <Link
          href="/hospitals/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          병원 등록
        </Link>
      </div>

      {hospitals.length === 0 ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">아직 등록된 병원이 없습니다.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Phase 2에서 공식 홈페이지 기반 Hospital Profile 등록 흐름을
            연결합니다.
          </p>
        </section>
      ) : (
        <div className="grid gap-4">
          {hospitals.map((hospital) => (
            <section key={hospital.id} className="rounded-xl border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{hospital.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    권한 {hospital.role}
                    {hospital.websiteUrl ? ` · ${hospital.websiteUrl}` : ""}
                  </p>
                </div>
                {hospital.isTest ? (
                  <span className="rounded-full border px-2.5 py-1 text-xs">
                    TEST
                  </span>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
