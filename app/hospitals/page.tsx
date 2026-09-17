import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { listHospitalsForUser } from "@/lib/hospitals/repository";

export default async function HospitalsPage() {
  const session = await requireSession();
  const hospitals = await listHospitalsForUser(session.user.id);

  return (
    <PageShell title="병원" description="병원 고유 정보, 공식 근거, 예약 진료 항목, CTA, Brand Claim을 저장합니다.">
      <div className="flex justify-end">
        <Link href="/hospitals/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">병원 등록</Link>
      </div>
      {hospitals.length === 0 ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">아직 등록된 병원이 없습니다.</h2>
        </section>
      ) : (
        <div className="grid gap-4">
          {hospitals.map((hospital) => (
            <Link key={hospital.id} href={`/hospitals/${hospital.id}`} className="rounded-xl border p-5 transition hover:bg-muted/40">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{hospital.name}</h2>
                    <span className="rounded-full border px-2 py-0.5 text-xs">{hospital.profileStatus}</span>
                    {hospital.isTest ? <span className="rounded-full border px-2 py-0.5 text-xs">TEST</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">권한 {hospital.role}{hospital.websiteUrl ? ` · ${hospital.websiteUrl}` : ""}</p>
                  <p className="mt-3 text-xs text-muted-foreground">공식 Source {hospital.sourceCount} · 현재 Fact {hospital.factCount}</p>
                </div>
                <span className="text-sm text-muted-foreground">Profile 보기 →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
