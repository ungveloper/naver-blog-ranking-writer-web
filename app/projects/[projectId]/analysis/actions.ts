"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";
import {
  importBenchmarkUrls,
} from "@/lib/benchmarks/repository";
import {
  resolveSerpBenchmarkSelection,
  saveSerpBenchmarkSelection,
  searchAndStoreProjectSerp,
} from "@/lib/serp/repository";

function getProjectId(formData: FormData) {
  return String(formData.get("projectId") || "");
}

export async function searchNaverSerpAction(
  formData: FormData,
) {
  const session = await requireSession();
  const projectId = getProjectId(formData);

  if (!projectId) {
    redirect("/projects");
  }

  let stored:
    | Array<{
        id: string;
        device: "MOBILE" | "DESKTOP";
        count: number;
      }>
    | undefined;

  try {
    stored = await searchAndStoreProjectSerp(
      session.user.id,
      projectId,
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "SERP_SEARCH_FORBIDDEN"
        ? "이 프로젝트에서 Naver 검색을 실행할 권한이 없습니다."
        : error instanceof Error
          ? error.message
          : "Naver 통합검색 결과를 가져오지 못했습니다.";

    redirect(
      `/projects/${projectId}/analysis?error=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(
    `/projects/${projectId}/analysis`,
  );

  const total = (stored ?? []).reduce(
    (sum, item) => sum + item.count,
    0,
  );

  redirect(
    `/projects/${projectId}/analysis?searched=${total}`,
  );
}

export async function finalizeSerpBenchmarkAction(
  formData: FormData,
) {
  const session = await requireSession();
  const projectId = getProjectId(formData);
  const snapshotId = String(
    formData.get("snapshotId") || "",
  );
  const resultIds = formData
    .getAll("resultId")
    .filter(
      (value): value is string =>
        typeof value === "string" && value.length > 0,
    );

  if (!projectId || !snapshotId) {
    redirect("/projects");
  }

  if (
    resultIds.length < 1 ||
    resultIds.length > 10
  ) {
    redirect(
      `/projects/${projectId}/analysis?error=${encodeURIComponent("통합검색 Blog 결과 중 1~10개를 선택하세요.")}`,
    );
  }

  let importedCount = 0;

  try {
    const selected =
      await resolveSerpBenchmarkSelection(
        session.user.id,
        projectId,
        snapshotId,
        resultIds,
      );

    importedCount = await importBenchmarkUrls(
      session.user.id,
      projectId,
      selected.map((item) => item.url),
    );

    await saveSerpBenchmarkSelection(
      session.user.id,
      projectId,
      snapshotId,
      resultIds,
    );
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "BENCHMARK_IMPORT_FORBIDDEN"
        ? "이 프로젝트의 Benchmark를 수정할 권한이 없습니다."
        : error instanceof Error
          ? error.message
          : "Benchmark 분석에 실패했습니다.";

    redirect(
      `/projects/${projectId}/analysis?error=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(
    `/projects/${projectId}/analysis`,
  );
  revalidatePath(
    `/projects/${projectId}/prompt`,
  );

  redirect(
    `/projects/${projectId}/analysis?imported=${importedCount}`,
  );
}
