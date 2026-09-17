import type { DevicePreference } from "@/lib/product/types";

export interface SerpSearchInput {
  keyword: string;
  device: Extract<DevicePreference, "MOBILE" | "DESKTOP">;
}

export interface SerpResult {
  rank: number;
  title: string;
  url: string;
  normalizedUrl: string;
  included: boolean;
  exclusionReason?: string;
}

export interface SerpSnapshot {
  keyword: string;
  device: SerpSearchInput["device"];
  capturedAt: string;
  results: SerpResult[];
}

export interface SerpProvider {
  search(input: SerpSearchInput): Promise<SerpSnapshot>;
}

export class ManualSerpProvider implements SerpProvider {
  constructor(private readonly urls: string[]) {}

  async search(input: SerpSearchInput): Promise<SerpSnapshot> {
    return {
      keyword: input.keyword,
      device: input.device,
      capturedAt: new Date().toISOString(),
      results: this.urls.map((url, index) => ({
        rank: index + 1,
        title: `수동 입력 ${index + 1}`,
        url,
        normalizedUrl: normalizeNaverBlogUrl(url),
        included: true,
      })),
    };
  }
}

export function normalizeNaverBlogUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname === "m.blog.naver.com") {
      return url.toString();
    }

    if (url.hostname === "blog.naver.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && parts[0] !== "PostView.naver") {
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
    return url.hostname === "blog.naver.com" || url.hostname === "m.blog.naver.com";
  } catch {
    return false;
  }
}
