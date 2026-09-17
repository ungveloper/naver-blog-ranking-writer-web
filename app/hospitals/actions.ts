"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";
import { createHospitalProfile } from "@/lib/hospitals/repository";
import { formDataToHospitalProfileInput } from "@/lib/hospitals/schema";

export async function createHospitalProfileAction(formData: FormData) {
  const session = await requireSession();
  const parsed = formDataToHospitalProfileInput(formData);

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ||
      "병원 등록 입력값을 다시 확인하세요.";
    redirect(`/hospitals/new?error=${encodeURIComponent(message)}`);
  }

  const hospitalId = await createHospitalProfile(session.user.id, parsed.data);
  revalidatePath("/hospitals");
  redirect(`/hospitals/${hospitalId}?created=1`);
}
