import type { DevicePreference } from "@/lib/product/types";

export interface SerpSearchInput {
  keyword: string;
  device: Extract<
    DevicePreference,
    "MOBILE" | "DESKTOP"
  >;
}

export type SerpResultOrigin =
  | "INTEGRATED"
  | "VIEW_FALLBACK";

export type SerpSectionKind =
  | "REVIEW_BLOG"
  | "WEB_BLOG"
  | "OTHER";

export interface SerpResult {
  rank: number;
  title: string;
  snippet?: string;
  sourceName?: string;
  thumbnailUrl?: string;
  url: string;
  normalizedUrl: string;
  origin?: SerpResultOrigin;
  included: boolean;
  exclusionReason?: string;
  sectionArea?: string;
  blockId?: string;
  domIndex?: number;
  sectionKind?: SerpSectionKind;
}

export interface SerpSnapshot {
  keyword: string;
  device: SerpSearchInput["device"];
  capturedAt: string;
  results: SerpResult[];
  provider?: string;
  searchUrl?: string;
  responseHash?: string;
}

export interface SerpProvider {
  search(input: SerpSearchInput): Promise<SerpSnapshot>;
}

export class ManualSerpProvider implements SerpProvider {
  constructor(private readonly urls: string[]) {}

  async search(
    input: SerpSearchInput,
  ): Promise<SerpSnapshot> {
    return {
      keyword: input.keyword,
      device: input.device,
      capturedAt: new Date().toISOString(),
      provider: "MANUAL",
      results: this.urls.map((url, index) => ({
        rank: index + 1,
        title: `수동 입력 ${index + 1}`,
        url,
        normalizedUrl: normalizeNaverBlogUrl(url),
        included: index < 7,
      })),
    };
  }
}

export function normalizeNaverBlogUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);

    if (url.hostname === "m.blog.naver.com") {
      const parts = url.pathname
        .split("/")
        .filter(Boolean);

      if (parts.length >= 2) {
        return `https://m.blog.naver.com/${parts[0]}/${parts[1]}`;
      }

      return url.toString();
    }

    if (url.hostname === "blog.naver.com") {
      const parts = url.pathname
        .split("/")
        .filter(Boolean);

      if (
        parts.length >= 2 &&
        parts[0] !== "PostView.naver"
      ) {
        return `https://m.blog.naver.com/${parts[0]}/${parts[1]}`;
      }

      const blogId = url.searchParams.get("blogId");
      const logNo = url.searchParams.get("logNo");

      if (blogId && logNo) {
        return `https://m.blog.naver.com/${blogId}/${logNo}`;
      }
    }

    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}

export function isNaverBlogPostUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);

    if (
      url.hostname !== "blog.naver.com" &&
      url.hostname !== "m.blog.naver.com"
    ) {
      return false;
    }

    const parts = url.pathname
      .split("/")
      .filter(Boolean);

    if (
      parts.length >= 2 &&
      parts[0] !== "PostView.naver"
    ) {
      return /^\d+$/.test(parts[1]);
    }

    return Boolean(
      url.searchParams.get("blogId") &&
        url.searchParams.get("logNo"),
    );
  } catch {
    return false;
  }
}
