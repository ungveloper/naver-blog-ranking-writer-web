import Link from "next/link";
import { PageShell } from "@/components/app/page-shell";
import { PRODUCT_DEFAULTS } from "@/lib/product/constants";

const cards = [
  {
    title: "병원 프로필",
    body: "공식 홈페이지와 채널에서 확인한 병원 정보를 근거와 함께 재사용합니다.",
    href: "/hospitals",
    cta: "병원 관리",
  },
  {
    title: "새 콘텐츠 프로젝트",
    body: "Primary Keyword를 중심으로 SERP → Benchmark → 분석 → 인터뷰 → 원고 흐름을 시작합니다.",
    href: "/projects/new",
    cta: "새 프로젝트",
  },
  {
    title: "분석 원칙",
    body: `Benchmark 기본 ${PRODUCT_DEFAULTS.benchmarkCount}개, 모바일 우선, READY TO WRITE ${PRODUCT_DEFAULTS.readyToWriteScore}점 기준으로 설계되어 있습니다.`,
    href: "/projects/demo/analysis",
    cta: "분석 화면 보기",
  },
];

export default function Home() {
  return (
    <PageShell
      title="Naver Blog Ranking Writer"
      description="현재 상위 노출 콘텐츠와 Blog Context를 역분석하고 의료/병원 근거와 Adaptive Interview를 결합해 네이버 블로그 게시용 원고를 만드는 내부 도구입니다."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-2 min-h-20 text-sm leading-6 text-muted-foreground">{card.body}</p>
            <Link
              href={card.href}
              className="mt-5 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-xl border p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">현재 단계</p>
            <p className="mt-1 text-sm text-muted-foreground">
              제품 기준/도메인 계약을 고정한 Foundation 단계입니다. 다음은 Supabase + Better Auth 연결입니다.
            </p>
          </div>
          <span className="mt-3 w-fit rounded-full border px-3 py-1 text-xs font-medium md:mt-0">Phase 0</span>
        </div>
      </section>
    </PageShell>
  );
}
