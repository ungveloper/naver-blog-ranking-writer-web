import type { FetchedNaverBlogPost } from "@/lib/naver-blog/parser/types";
import {
  assertNaverBlogUrl,
  toAbsoluteUrl,
  toMobilePostUrl,
} from "@/lib/naver-blog/parser/url";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language":
    "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
};

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `Naver Blog 페이지를 불러오지 못했습니다. (${response.status})`,
    );
  }

  return response.text();
}

async function resolveInnerPostUrl(inputUrl: string) {
  const input = assertNaverBlogUrl(inputUrl);

  if (input.hostname === "m.blog.naver.com") {
    return input.toString();
  }

  try {
    return toMobilePostUrl(input.toString());
  } catch {
    const outerHtml = await fetchHtml(input.toString());

    const iframeMatch = outerHtml.match(
      /<iframe[^>]*id=["']?mainFrame["']?[^>]*src=["']([^"']+)["']/i,
    );

    if (iframeMatch?.[1]) {
      return toAbsoluteUrl(
        "https://blog.naver.com",
        iframeMatch[1],
      );
    }

    return input.toString();
  }
}

export async function fetchNaverBlogPost(
  inputUrl: string,
): Promise<FetchedNaverBlogPost> {
  const innerUrl = await resolveInnerPostUrl(inputUrl);
  const resolvedUrl = toMobilePostUrl(innerUrl);
  const html = await fetchHtml(resolvedUrl);

  return {
    sourceUrl: inputUrl.trim(),
    resolvedUrl,
    html,
  };
}
