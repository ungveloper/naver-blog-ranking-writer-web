import { PageShell } from "@/components/app/page-shell";

export default function NewHospitalPage() {
  return (
    <PageShell
      title="병원 등록"
      description="향후 공식 홈페이지와 공식 채널을 자동 조사해 Profile Draft를 만들고, 확인되지 않은 내용만 인터뷰로 보완합니다."
    >
      <form className="grid max-w-2xl gap-5 rounded-xl border p-5">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">병원명</span>
          <input className="rounded-md border bg-background px-3 py-2" placeholder="예: 청맥병원" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">공식 홈페이지</span>
          <input className="rounded-md border bg-background px-3 py-2" placeholder="https://..." />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">담당 진료 분야</span>
          <input className="rounded-md border bg-background px-3 py-2" placeholder="예: 하지정맥류, 골반정맥질환" />
        </label>
        <button type="button" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Profile Draft 만들기 (추후 연결)
        </button>
      </form>
    </PageShell>
  );
}
