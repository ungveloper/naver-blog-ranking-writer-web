"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-session";
import { importBenchmarkUrls } from "@/lib/benchmarks/repository";
import {
  resolveSerpBenchmarkSelection,
  saveSerpBenchmarkSelection,
  searchAndStoreProjectSerp,
} from "@/lib/serp/repository";

function getProjectId(formData: FormData) {
  return String(formData.get("projectId") || "");
}

function getSerpSearchErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message === "SERP_SEARCH_FORBIDDEN"
  ) {
    return "이 프로젝트에서 Naver 검색을 실행할 권한이 없습니다.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Naver 통합검색 결과를 가져오지 못했습니다.";
}

function getBenchmarkErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message === "BENCHMARK_IMPORT_FORBIDDEN"
  ) {
    return "이 프로젝트의 Benchmark를 수정할 권한이 없습니다.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Benchmark 분석에 실패했습니다.";
}

export async function searchNaverSerpAction(
  formData: FormData,
) {
  const session = await requireSession();
  const projectId = getProjectId(formData);

  if (!projectId) {
    redirect("/projects");
  }

  const stored = await (async () => {
    try {
      return await searchAndStoreProjectSerp(
        session.user.id,
        projectId,
      );
    } catch (error) {
      const message =
        getSerpSearchErrorMessage(error);

      redirect(
        `/projects/${projectId}/analysis?step=1&error=${encodeURIComponent(message)}`,
      );
    }
  })();

  const total = stored.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(
    `/projects/${projectId}/analysis`,
  );

  redirect(
    `/projects/${projectId}/analysis?step=2&searched=${total}`,
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
        typeof value === "string" &&
        value.length > 0,
    );

  if (!projectId || !snapshotId) {
    redirect("/projects");
  }

  if (
    resultIds.length < 1 ||
    resultIds.length > 10
  ) {
    redirect(
      `/projects/${projectId}/analysis?step=2&error=${encodeURIComponent(
        "통합검색 Blog 결과 중 1~10개를 선택하세요.",
      )}`,
    );
  }

  const importedCount = await (async () => {
    try {
      const selected =
        await resolveSerpBenchmarkSelection(
          session.user.id,
          projectId,
          snapshotId,
          resultIds,
        );

      const count =
        await importBenchmarkUrls(
          session.user.id,
          projectId,
          selected.map(
            (item) => item.url,
          ),
        );

      await saveSerpBenchmarkSelection(
        session.user.id,
        projectId,
        snapshotId,
        resultIds,
      );

      return count;
    } catch (error) {
      const message =
        getBenchmarkErrorMessage(error);

      redirect(
        `/projects/${projectId}/analysis?step=2&error=${encodeURIComponent(message)}`,
      );
    }
  })();

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(
    `/projects/${projectId}/analysis`,
  );
  revalidatePath(
    `/projects/${projectId}/prompt`,
  );

  redirect(
    `/projects/${projectId}/analysis?step=3&imported=${importedCount}`,
  );
}
