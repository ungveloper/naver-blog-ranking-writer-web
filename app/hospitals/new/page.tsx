import { PageShell } from "@/components/app/page-shell";
import { createHospitalProfileAction } from "@/app/hospitals/actions";

type Props = { searchParams: Promise<{ error?: string }> };
const inputClassName =
  "rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground/40";

export default async function NewHospitalPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <PageShell
      title="병원 등록"
      description="공식 채널·공식 소개·예약 진료 항목·CTA·Brand Claim을 구조화합니다."
    >
      {error ? <div className="max-w-4xl rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      <form action={createHospitalProfileAction} className="grid max-w-4xl gap-8">
        <section className="grid gap-5 rounded-xl border p-5">
          <h2 className="font-semibold">기본 정보</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm"><span className="font-medium">병원명 *</span><input name="name" required className={inputClassName}/></label>
            <label className="grid gap-2 text-sm"><span className="font-medium">영문명</span><input name="englishName" className={inputClassName}/></label>
          </div>
          <label className="grid gap-2 text-sm"><span className="font-medium">주소</span><input name="address" className={inputClassName}/></label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm"><span className="font-medium">대표 전화</span><input name="phone" className={inputClassName}/></label>
            <label className="grid gap-2 text-sm"><span className="font-medium">FAX</span><input name="fax" className={inputClassName}/></label>
            <label className="grid gap-2 text-sm"><span className="font-medium">개원일</span><input name="openedOn" type="date" className={inputClassName}/></label>
          </div>
          <label className="grid gap-2 text-sm"><span className="font-medium">병원 소개</span><textarea name="summary" rows={4} className={inputClassName}/></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">진료 철학 / 핵심 원칙</span><textarea name="philosophy" rows={4} className={inputClassName}/></label>
        </section>

        <section className="grid gap-5 rounded-xl border p-5">
          <div><h2 className="font-semibold">공식 채널</h2><p className="mt-1 text-sm text-muted-foreground">Primary 네이버 블로그는 병원당 1개만 지정합니다.</p></div>
          <label className="grid gap-2 text-sm"><span className="font-medium">공식 홈페이지</span><input name="websiteUrl" className={inputClassName}/></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">공식 네이버 블로그 (Primary)</span><input name="officialBlogUrl" className={inputClassName}/></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm"><span className="font-medium">YouTube</span><input name="youtubeUrl" className={inputClassName}/></label>
            <label className="grid gap-2 text-sm"><span className="font-medium">Instagram</span><input name="instagramUrl" className={inputClassName}/></label>
          </div>
        </section>

        <section className="grid gap-5 rounded-xl border p-5">
          <div><h2 className="font-semibold">네이버 예약 공식 정보</h2><p className="mt-1 text-sm text-muted-foreground">병원이 직접 작성한 예약 소개문을 Evidence 원문으로 저장합니다.</p></div>
          <label className="grid gap-2 text-sm"><span className="font-medium">네이버 예약 URL</span><input name="naverBookingUrl" className={inputClassName} placeholder="긴 Naver Map URL도 가능"/></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">공식 예약 소개문</span><textarea name="bookingIntroText" rows={12} className={inputClassName}/></label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">예약 진료 항목</span>
            <textarea name="bookingServiceLines" rows={6} className={inputClassName} placeholder={"정맥류 진료 | 하지정맥류 / 골반정맥류 / 정계정맥류\n자궁근종 상담 | 월경과다, 심한 생리통, 빈혈"}/>
            <span className="text-xs text-muted-foreground">한 줄에 `진료명 | 상세 설명` 형식</span>
          </label>
          <label className="grid gap-2 text-sm"><span className="font-medium">네이버 톡톡 URL</span><input name="naverTalkUrl" className={inputClassName}/></label>
        </section>

        <section className="grid gap-5 rounded-xl border p-5">
          <div><h2 className="font-semibold">마케팅 기준</h2><p className="mt-1 text-sm text-muted-foreground">병원이 강조하는 표현은 보존하되 Writer 사용 전 Compliance 검증합니다.</p></div>
          <label className="grid gap-2 text-sm"><span className="font-medium">마케팅 우선 진료분야</span><textarea name="prioritySpecialties" rows={3} className={inputClassName}/></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">Brand Claims</span><textarea name="brandClaims" rows={6} className={inputClassName}/><span className="text-xs text-muted-foreground">한 줄에 하나씩. 기본 compliance_status=UNCHECKED.</span></label>
        </section>

        <section className="grid gap-5 rounded-xl border p-5">
          <h2 className="font-semibold">병원 제공 공식자료</h2>
          <label className="grid gap-2 text-sm"><span className="font-medium">자료명</span><input name="internalSourceLabel" className={inputClassName} placeholder="예: 2026 청맥병원 브랜드북"/></label>
          <label className="grid gap-2 text-sm"><span className="font-medium">확정 수준</span><select name="internalSourceStatus" defaultValue="REVIEW_REQUIRED" className={inputClassName}><option value="CONFIRMED">병원 공식 확인 완료</option><option value="REVIEW_REQUIRED">병원 확인 필요</option></select></label>
        </section>

        <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Hospital Profile 만들기</button>
      </form>
    </PageShell>
  );
}
