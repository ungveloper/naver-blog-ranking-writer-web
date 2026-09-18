import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import {
  isNaverBlogPostUrl,
  normalizeNaverBlogUrl,
  type SerpProvider,
  type SerpResult,
  type SerpResultOrigin,
  type SerpSearchInput,
  type SerpSnapshot,
} from "@/lib/serp/provider";

const MAX_CANDIDATES = 20;
const INTEGRATED_TARGET = 10;

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

type SearchFetchResult = {
  url: string;
  html: string;
};

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeRepeatedly(
  value: string,
  maxRounds = 4,
) {
  let current = value;

  for (let round = 0; round < maxRounds; round += 1) {
    try {
      const next = decodeURIComponent(current);

      if (next === current) {
        break;
      }

      current = next;
    } catch {
      break;
    }
  }

  return current;
}

function extractBlogUrlFromValue(
  rawValue: string | null | undefined,
): string | null {
  if (!rawValue) {
    return null;
  }

  const candidates = new Set<string>([
    rawValue.trim(),
    decodeRepeatedly(rawValue.trim()),
  ]);

  for (const candidate of Array.from(candidates)) {
    const embeddedMatches = candidate.match(
      /https?:\/\/(?:m\.)?blog\.naver\.com\/[^\s"'<>\\]+/gi,
    );

    for (const embedded of embeddedMatches ?? []) {
      candidates.add(
        embedded
          .replace(/&amp;/g, "&")
          .replace(/[),.;]+$/g, ""),
      );
    }

    try {
      const parsed = new URL(candidate);

      for (const value of parsed.searchParams.values()) {
        const decoded = decodeRepeatedly(value);

        if (decoded !== value) {
          candidates.add(decoded);
        }

        candidates.add(value);
      }
    } catch {
      // Some Naver attributes are not full URLs.
    }
  }

  for (const candidate of candidates) {
    const cleaned = candidate
      .replace(/&amp;/g, "&")
      .trim();

    if (isNaverBlogPostUrl(cleaned)) {
      return normalizeNaverBlogUrl(cleaned);
    }
  }

  return null;
}

function extractAnchorTitle(
  $: cheerio.CheerioAPI,
  element: Element,
  fallbackRank: number,
) {
  const anchor = $(element);

  const directCandidates = [
    anchor.attr("title"),
    anchor.attr("aria-label"),
    anchor.text(),
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeText(candidate || "");

    if (normalized.length >= 4) {
      return normalized.slice(0, 180);
    }
  }

  const parent = anchor.closest(
    "li, article, .bx, .view_wrap, .api_subject_bx, .fds-collection-root",
  );

  const parentText = normalizeText(parent.text());

  if (parentText.length >= 4) {
    return parentText.slice(0, 180);
  }

  return `Naver Blog 검색 결과 ${fallbackRank}`;
}

function extractCandidates(
  html: string,
  origin: SerpResultOrigin,
) {
  const $ = cheerio.load(html);
  const ordered: Array<{
    title: string;
    url: string;
    normalizedUrl: string;
    origin: SerpResultOrigin;
  }> = [];
  const seen = new Map<
    string,
    {
      index: number;
      titleLength: number;
    }
  >();

  $("a").each((_, element) => {
    const anchor = $(element);
    const values = [
      anchor.attr("href"),
      anchor.attr("data-url"),
      anchor.attr("data-href"),
      anchor.attr("data-link"),
      anchor.attr("data-target-url"),
    ];

    let normalizedUrl: string | null = null;

    for (const value of values) {
      normalizedUrl =
        extractBlogUrlFromValue(value);

      if (normalizedUrl) {
        break;
      }
    }

    if (!normalizedUrl) {
      return;
    }

    const title = extractAnchorTitle(
      $,
      element,
      ordered.length + 1,
    );

    const existing = seen.get(normalizedUrl);

    if (existing) {
      if (title.length > existing.titleLength) {
        ordered[existing.index].title = title;
        existing.titleLength = title.length;
      }

      return;
    }

    seen.set(normalizedUrl, {
      index: ordered.length,
      titleLength: title.length,
    });

    ordered.push({
      title,
      url: normalizedUrl,
      normalizedUrl,
      origin,
    });
  });

  return ordered;
}

function buildSearchUrl(
  input: SerpSearchInput,
  mode: "INTEGRATED" | "VIEW",
) {
  const mobile = input.device === "MOBILE";
  const base = mobile
    ? "https://m.search.naver.com/search.naver"
    : "https://search.naver.com/search.naver";

  const url = new URL(base);

  url.searchParams.set(
    "where",
    mode === "INTEGRATED"
      ? mobile
        ? "m"
        : "nexearch"
      : mobile
        ? "m_view"
        : "view",
  );
  url.searchParams.set("query", input.keyword);
  url.searchParams.set("ie", "utf8");

  return url.toString();
}

function looksBlocked(html: string) {
  const normalized = html.toLocaleLowerCase("ko-KR");

  return [
    "captcha",
    "자동입력 방지",
    "비정상적인 접근",
    "접근이 제한",
    "보안 확인",
  ].some((needle) => normalized.includes(needle));
}

async function fetchSearchPage(
  input: SerpSearchInput,
  mode: "INTEGRATED" | "VIEW",
): Promise<SearchFetchResult> {
  const url = buildSearchUrl(input, mode);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        input.device === "MOBILE"
          ? MOBILE_USER_AGENT
          : DESKTOP_USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9",
      Referer: "https://www.naver.com/",
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(
      `Naver 검색 응답 실패 (${response.status})`,
    );
  }

  const html = await response.text();

  if (looksBlocked(html)) {
    throw new Error(
      "Naver 검색에서 보안 확인/접근 제한 응답을 받았습니다. 우회하지 않고 중단했습니다. 잠시 후 다시 시도하세요.",
    );
  }

  return {
    url,
    html,
  };
}

export class NaverIntegratedSearchProvider
  implements SerpProvider
{
  async search(
    input: SerpSearchInput,
  ): Promise<SerpSnapshot> {
    const integrated = await fetchSearchPage(
      input,
      "INTEGRATED",
    );

    const integratedCandidates = extractCandidates(
      integrated.html,
      "INTEGRATED",
    );

    const combined = [...integratedCandidates];
    let responseMaterial = integrated.html;

    if (
      combined.length < INTEGRATED_TARGET &&
      combined.length < MAX_CANDIDATES
    ) {
      const view = await fetchSearchPage(
        input,
        "VIEW",
      );

      responseMaterial += `\n${view.html}`;

      const fallbackCandidates = extractCandidates(
        view.html,
        "VIEW_FALLBACK",
      );
      const seen = new Set(
        combined.map((item) => item.normalizedUrl),
      );

      for (const candidate of fallbackCandidates) {
        if (seen.has(candidate.normalizedUrl)) {
          continue;
        }

        seen.add(candidate.normalizedUrl);
        combined.push(candidate);

        if (combined.length >= MAX_CANDIDATES) {
          break;
        }
      }
    }

    if (combined.length === 0) {
      throw new Error(
        "Naver 검색 결과 HTML에서 Naver Blog 글을 찾지 못했습니다. 검색 화면 구조가 바뀌었거나 일시적으로 결과가 제한되었을 수 있습니다.",
      );
    }

    const results: SerpResult[] = combined
      .slice(0, MAX_CANDIDATES)
      .map((candidate, index) => ({
        rank: index + 1,
        title: candidate.title,
        url: candidate.url,
        normalizedUrl: candidate.normalizedUrl,
        origin: candidate.origin,
        included: index < 7,
      }));

    return {
      keyword: input.keyword,
      device: input.device,
      capturedAt: new Date().toISOString(),
      provider: "NAVER_INTEGRATED_HTML",
      searchUrl: integrated.url,
      responseHash: createHash("sha256")
        .update(responseMaterial)
        .digest("hex"),
      results,
    };
  }
}
