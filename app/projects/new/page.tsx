import { PageShell } from "@/components/app/page-shell";
import { PRODUCT_DEFAULTS } from "@/lib/product/constants";

export default function NewProjectPage() {
  return (
    <PageShell
      title="새 콘텐츠 프로젝트"
      description="Primary Keyword가 분석의 중심입니다. Secondary Keywords는 필요할 때만 추가하며 메인 방향을 흐리지 않도록 낮은 가중치로 참고합니다."
    >
      <form className="grid max-w-3xl gap-5 rounded-xl border p-5">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">병원</span>
          <select className="rounded-md border bg-background px-3 py-2" defaultValue="cheongmaek">
            <option value="cheongmaek">청맥병원 (TEST)</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Primary Keyword</span>
          <input className="rounded-md border bg-background px-3 py-2" placeholder="예: 부산하지정맥류" />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Secondary Keywords</span>
          <input className="rounded-md border bg-background px-3 py-2" placeholder="쉼표로 구분 · 선택사항" />
        </label>

        <fieldset className="grid gap-2 text-sm">
          <legend className="font-medium">검색 기준</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2"><input type="radio" name="device" defaultChecked /> 모바일</label>
            <label className="flex items-center gap-2"><input type="radio" name="device" /> 데스크탑</label>
            <label className="flex items-center gap-2"><input type="radio" name="device" /> 둘 다</label>
          </div>
        </fieldset>

        <p className="rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">
          Benchmark 기본 {PRODUCT_DEFAULTS.benchmarkCount}개 · 최소 {PRODUCT_DEFAULTS.benchmarkMin}개 · 최대 {PRODUCT_DEFAULTS.benchmarkMax}개. 자동 SERP 수집 전까지는 수동 URL Provider를 fallback으로 유지합니다.
        </p>

        <button type="button" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          검색 결과 조사 시작 (추후 연결)
        </button>
      </form>
    </PageShell>
  );
}
