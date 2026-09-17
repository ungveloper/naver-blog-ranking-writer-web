import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { getHospitalProfileForUser } from "@/lib/hospitals/repository";

type Props = {
  params: Promise<{ hospitalId: string }>;
  searchParams: Promise<{ created?: string }>;
};

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export default async function HospitalProfilePage({
  params,
  searchParams,
}: Props) {
  const session = await requireSession();
  const { hospitalId } = await params;
  const { created } = await searchParams;
  const hospital = await getHospitalProfileForUser(
    session.user.id,
    hospitalId,
  );

  if (!hospital) {
    notFound();
  }

  return (
    <PageShell
      title={hospital.name}
      description="Hospital Evidence, 예약 진료 항목, 병원 Fact와 Brand Claim을 분리해 관리합니다."
    >
      {created ? (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          Hospital Profile이 생성되었습니다.
        </div>
      ) : null}

      <section className="grid gap-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{hospital.profileStatus}</Badge>
          <Badge>{hospital.role}</Badge>
          <Badge>Profile v{hospital.profileVersion}</Badge>
        </div>

        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">영문명</p>
            <p className="mt-1">{hospital.englishName || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">개원일</p>
            <p className="mt-1">{hospital.openedOn || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">대표 전화</p>
            <p className="mt-1">{hospital.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">주소</p>
            <p className="mt-1">{hospital.address || "-"}</p>
          </div>
        </div>

        {hospital.summary ? (
          <p className="whitespace-pre-line text-sm leading-6">
            {hospital.summary}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Official Sources</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            병원이 직접 작성한 공식 원문도 함께 보존합니다.
          </p>
        </div>

        {hospital.sources.length === 0 ? (
          <Empty>등록된 공식 Source가 없습니다.</Empty>
        ) : (
          <div className="grid gap-3">
            {hospital.sources.map((source) => (
              <article
                key={source.id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">
                    {source.label}
                  </strong>
                  <Badge>{source.kind}</Badge>
                  <Badge>{source.status}</Badge>
                  {source.isPrimary ? <Badge>PRIMARY</Badge> : null}
                </div>

                {source.url ? (
                  <a
                    className="mt-3 block break-all text-sm underline underline-offset-4"
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.url}
                  </a>
                ) : null}

                {source.contentText ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      공식 원문 보기
                    </summary>
                    <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs leading-5">
                      {source.contentText}
                    </pre>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">예약 진료 항목</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            공식 예약 채널에 실제 노출되는 선택지를 구조화합니다.
          </p>
        </div>

        {hospital.serviceOfferings.length === 0 ? (
          <Empty>등록된 예약 진료 항목이 없습니다.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {hospital.serviceOfferings.map((service) => (
              <article
                key={service.id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">
                    {service.title}
                  </strong>
                  <Badge>{service.channel}</Badge>
                  <Badge>{service.status}</Badge>
                </div>

                <p className="mt-3 text-sm leading-6">
                  {service.detail}
                </p>

                <p className="mt-3 text-xs text-muted-foreground">
                  {service.sourceLabel || "Source 미연결"}
                  {service.bookingLabel
                    ? ` · ${service.bookingLabel}`
                    : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">
          Marketing Priority Specialties
        </h2>

        {hospital.specialties.length === 0 ? (
          <Empty>등록된 진료분야가 없습니다.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hospital.specialties.map((specialty) => (
              <span
                key={specialty.id}
                className="rounded-full border px-3 py-1.5 text-sm"
              >
                {specialty.priority
                  ? `${specialty.priority}. `
                  : ""}
                {specialty.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">CTA</h2>

        {hospital.ctas.length === 0 ? (
          <Empty>등록된 CTA가 없습니다.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {hospital.ctas.map((cta) => (
              <article
                key={cta.id}
                className="rounded-xl border p-4"
              >
                <p className="text-xs text-muted-foreground">
                  우선순위 {cta.priority} · {cta.kind}
                </p>
                <p className="mt-2 font-medium">{cta.label}</p>

                {cta.value ? (
                  <p className="mt-2 text-sm">{cta.value}</p>
                ) : null}

                {cta.url ? (
                  <a
                    href={cta.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-xs underline underline-offset-4"
                  >
                    링크 열기
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Brand Claims</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            병원 공식 표현이어도 UNCHECKED이면 Writer에 자동
            전달하지 않습니다.
          </p>
        </div>

        {hospital.brandClaims.length === 0 ? (
          <Empty>등록된 Brand Claim이 없습니다.</Empty>
        ) : (
          <div className="grid gap-3">
            {hospital.brandClaims.map((claim) => (
              <article
                key={claim.id}
                className="rounded-xl border p-4"
              >
                <p className="text-sm font-medium">
                  {claim.claim}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{claim.factStatus}</Badge>
                  <Badge>{claim.complianceStatus}</Badge>
                  {claim.evidenceLabel ? (
                    <Badge>{claim.evidenceLabel}</Badge>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Hospital Facts</h2>

        {hospital.facts.length === 0 ? (
          <Empty>현재 Fact가 없습니다.</Empty>
        ) : (
          <div className="grid gap-3">
            {hospital.facts.map((fact) => (
              <article
                key={fact.id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{fact.category}</Badge>
                  <Badge>{fact.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    v{fact.version}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6">
                  {fact.value}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {fact.factKey}
                  {fact.evidenceLabel
                    ? ` · Evidence: ${fact.evidenceLabel}`
                    : ""}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Writing Policy</h2>
        <p className="mt-3 text-sm">
          Tone strategy:{" "}
          <strong>
            {hospital.writingPreferences?.toneStrategy ??
              "ADAPTIVE"}
          </strong>
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hospital.writingPreferences?.notes ??
            "프로젝트별 상위 문서 분석을 바탕으로 Tone을 추천합니다."}
        </p>
      </section>
    </PageShell>
  );
}
