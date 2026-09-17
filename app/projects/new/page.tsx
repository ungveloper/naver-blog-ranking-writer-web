import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { requireSession } from "@/lib/auth-session";
import { listHospitalsForUser } from "@/lib/hospitals/repository";
import { PRODUCT_DEFAULTS } from "@/lib/product/constants";
import { createContentProjectAction } from "@/app/projects/actions";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const inputClassName =
  "rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40";

export default async function NewProjectPage({
  searchParams,
}: Props) {
  const session = await requireSession();
  const hospitals = await listHospitalsForUser(
    session.user.id,
  );
  const editableHospitals = hospitals.filter(
    (hospital) =>
      hospital.role === "OWNER" ||
      hospital.role === "EDITOR",
  );
  const { error } = await searchParams;

  return (
    <PageShell
      title="새 콘텐츠 프로젝트"
      description="Hospital Profile은 재사용하고, Primary Keyword는 포스팅마다 새로 입력합니다. Secondary Keywords는 보조 문맥으로만 사용합니다."
    >
      {error ? (
        <div className="max-w-3xl rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {editableHospitals.length === 0 ? (
        <section className="grid max-w-3xl gap-4 rounded-xl border border-dashed p-6">
          <div>
            <h2 className="font-semibold">
              프로젝트를 만들 수 있는 병원이 없습니다.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              OWNER 또는 EDITOR 권한이 있는 Hospital Profile이
              필요합니다.
            </p>
          </div>
          <Link
            href="/hospitals/new"
            className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            병원 등록
          </Link>
        </section>
      ) : (
        <form
          action={createContentProjectAction}
          className="grid max-w-3xl gap-6 rounded-xl border p-5"
        >
          <label className="grid gap-2 text-sm">
            <span className="font-medium">병원</span>
            <select
              name="hospitalId"
              required
              className={inputClassName}
              defaultValue={editableHospitals[0]?.id}
            >
              {editableHospitals.map((hospital) => (
                <option
                  key={hospital.id}
                  value={hospital.id}
                >
                  {hospital.name} · {hospital.profileStatus}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              Primary Keyword *
            </span>
            <input
              name="primaryKeyword"
              required
              className={inputClassName}
              placeholder="예: 부산하지정맥류"
              autoComplete="off"
            />
            <span className="text-xs leading-5 text-muted-foreground">
              경쟁 분석, Search Intent, Benchmark 선정의 중심
              키워드입니다.
            </span>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">
              Secondary Keywords
            </span>
            <textarea
              name="secondaryKeywords"
              rows={3}
              className={inputClassName}
              placeholder="예: 하지정맥류병원, 서면하지정맥류 · 쉼표 또는 줄바꿈 구분"
            />
            <span className="text-xs leading-5 text-muted-foreground">
              선택사항입니다. Primary Keyword의 방향을 바꾸지
              않고 낮은 가중치의 문맥 신호로 사용합니다.
            </span>
          </label>

          <fieldset className="grid gap-3 text-sm">
            <legend className="font-medium">검색 기준</legend>
            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="devicePreference"
                  value="MOBILE"
                  defaultChecked
                />
                모바일
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="devicePreference"
                  value="DESKTOP"
                />
                데스크탑
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="devicePreference"
                  value="BOTH"
                />
                둘 다
              </label>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              기본은 모바일입니다. BOTH를 선택하면 향후 모바일
              결과를 주 기준으로 두고 데스크탑을 참고 비교할 수
              있게 연결합니다.
            </p>
          </fieldset>

          <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
            Benchmark 기본 {PRODUCT_DEFAULTS.benchmarkCount}개 ·
            최소 {PRODUCT_DEFAULTS.benchmarkMin}개 · 최대{" "}
            {PRODUCT_DEFAULTS.benchmarkMax}개. 프로젝트 생성
            직후 Workflow는 SERP 단계에서 시작합니다.
          </p>

          <button
            type="submit"
            className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            콘텐츠 프로젝트 만들기
          </button>
        </form>
      )}
    </PageShell>
  );
}
