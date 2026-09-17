const NAVER_BLOG_HOSTS = new Set([
  "blog.naver.com",
  "m.blog.naver.com",
]);

export function assertNaverBlogUrl(inputUrl: string) {
  let url: URL;

  try {
    url = new URL(inputUrl.trim());
  } catch {
    throw new Error("올바른 URL이 아닙니다.");
  }

  if (!NAVER_BLOG_HOSTS.has(url.hostname)) {
    throw new Error(
      "현재 Manual Benchmark는 Naver Blog URL만 지원합니다.",
    );
  }

  return url;
}

export function toAbsoluteUrl(
  baseUrl: string,
  target: string,
) {
  try {
    return new URL(target, baseUrl).toString();
  } catch {
    return "";
  }
}

export function toMobilePostUrl(resolvedUrl: string) {
  const url = assertNaverBlogUrl(resolvedUrl);

  if (url.hostname === "m.blog.naver.com") {
    return url.toString();
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (
    url.hostname === "blog.naver.com" &&
    parts.length >= 2 &&
    parts[0] !== "PostView.naver"
  ) {
    return `https://m.blog.naver.com/${parts[0]}/${parts[1]}`;
  }

  if (
    url.pathname.endsWith("/PostView.naver") ||
    url.pathname === "/PostView.naver"
  ) {
    const blogId = url.searchParams.get("blogId");
    const logNo = url.searchParams.get("logNo");

    if (blogId && logNo) {
      return `https://m.blog.naver.com/${blogId}/${logNo}`;
    }
  }

  throw new Error(
    "Naver Blog 글 URL을 모바일 포스트 URL로 변환하지 못했습니다.",
  );
}

export function normalizeNaverBlogUrlForDedup(
  inputUrl: string,
) {
  const url = assertNaverBlogUrl(inputUrl);

  try {
    return toMobilePostUrl(url.toString());
  } catch {
    return url.toString();
  }
}
