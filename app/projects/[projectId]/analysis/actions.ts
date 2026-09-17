"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";
import {
  importManualBenchmark,
} from "@/lib/benchmarks/repository";
import {
  manualBenchmarkSchema,
  parseManualBenchmarkUrls,
} from "@/lib/benchmarks/schema";

export async function importManualBenchmarkAction(
  formData: FormData,
) {
  const session = await requireSession();

  const parsed = manualBenchmarkSchema.safeParse({
    projectId: formData.get("projectId"),
    urls: formData.get("urls"),
  });

  if (!parsed.success) {
    const projectId = String(
      formData.get("projectId") || "",
    );
    const message =
      parsed.error.issues[0]?.message ||
      "Benchmark 입력값을 확인하세요.";

    redirect(
      `/projects/${projectId}/analysis?error=${encodeURIComponent(message)}`,
    );
  }

  let urls: string[];

  try {
    urls = parseManualBenchmarkUrls(parsed.data.urls);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Benchmark URL을 확인하세요.";

    redirect(
      `/projects/${parsed.data.projectId}/analysis?error=${encodeURIComponent(message)}`,
    );
  }

  try {
    const importedCount = await importManualBenchmark(
      session.user.id,
      parsed.data.projectId,
      urls,
    );

    revalidatePath(
      `/projects/${parsed.data.projectId}`,
    );
    revalidatePath(
      `/projects/${parsed.data.projectId}/analysis`,
    );

    redirect(
      `/projects/${parsed.data.projectId}/analysis?imported=${importedCount}`,
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "BENCHMARK_IMPORT_FORBIDDEN"
        ? "이 프로젝트의 Benchmark를 수정할 권한이 없습니다."
        : error instanceof Error
          ? error.message
          : "Benchmark 파싱에 실패했습니다.";

    redirect(
      `/projects/${parsed.data.projectId}/analysis?error=${encodeURIComponent(message)}`,
    );
  }
}
