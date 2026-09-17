"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";
import { createContentProject } from "@/lib/projects/repository";
import { formDataToContentProjectInput } from "@/lib/projects/schema";

export async function createContentProjectAction(
  formData: FormData,
) {
  const session = await requireSession();
  const parsed = formDataToContentProjectInput(formData);

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ||
      "프로젝트 입력값을 다시 확인하세요.";

    redirect(
      `/projects/new?error=${encodeURIComponent(message)}`,
    );
  }

  let projectId: string;

  try {
    projectId = await createContentProject(
      session.user.id,
      parsed.data,
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "PROJECT_CREATE_FORBIDDEN"
        ? "이 병원에는 프로젝트 생성 권한이 없습니다."
        : "프로젝트를 생성하지 못했습니다.";

    redirect(
      `/projects/new?error=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath("/projects");
  redirect(`/projects/${projectId}?created=1`);
}
