import { z } from "zod";
import { normalizeNaverBlogUrlForDedup } from "@/lib/naver-blog/parser/url";

export const manualBenchmarkSchema = z.object({
  projectId: z.string().uuid("프로젝트 ID가 올바르지 않습니다."),
  urls: z.string().trim().min(1, "Naver Blog URL을 입력하세요."),
});

export function parseManualBenchmarkUrls(raw: string) {
  const sourceUrls = raw
    .split(/\n+/)
    .map((url) => url.trim())
    .filter(Boolean);

  const unique = new Map<string, string>();

  for (const sourceUrl of sourceUrls) {
    const normalized =
      normalizeNaverBlogUrlForDedup(sourceUrl);

    if (!unique.has(normalized)) {
      unique.set(normalized, sourceUrl);
    }
  }

  const urls = Array.from(unique.values());

  if (urls.length < 5 || urls.length > 10) {
    throw new Error(
      "Benchmark URL은 중복 제외 5~10개를 입력하세요.",
    );
  }

  return urls;
}
