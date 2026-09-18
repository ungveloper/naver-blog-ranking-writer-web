import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import {
  captureUrlWithLocalBrowser,
} from "@/lib/serp/browser-capture";
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

type SearchProviderName =
  | "NAVER_HTTP_HTML"
  | "NAVER_LOCAL_BROWSER_DOM";

type SearchFetchResult = {
  url: string;
  html: string;
  provider: SearchProviderName;
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

  for (
    let round = 0;
    round < maxRounds;
    round += 1
  ) {
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

    for (
      const embedded of embeddedMatches ?? []
    ) {
      candidates.add(
        embedded
          .replace(/&amp;/g, "&")
          .replace(/[),.;]+$/g, ""),
      );
    }

    try {
      const parsed = new URL(candidate);

      for (
        const value of parsed.searchParams.values()
      ) {
        const decoded =
          decodeRepeatedly(value);

        if (decoded !== value) {
          candidates.add(decoded);
        }

        candidates.add(value);
      }
    } catch {
      // Naver attributes can contain partial URLs.
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
    const normalized = normalizeText(
      candidate || "",
    );

    if (normalized.length >= 4) {
      return normalized.slice(0, 180);
    }
  }

  const parent = anchor.closest(
    "li, article, .bx, .view_wrap, .api_subject_bx, .fds-collection-root",
  );

  const parentText = normalizeText(
    parent.text(),
  );

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

    let normalizedUrl: string | null =
      null;

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

    const existing =
      seen.get(normalizedUrl);

    if (existing) {
      if (
        title.length >
        existing.titleLength
      ) {
        ordered[existing.index].title =
          title;
        existing.titleLength =
          title.length;
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
  const mobile =
    input.device === "MOBILE";

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

  url.searchParams.set(
    "query",
    input.keyword,
  );
  url.searchParams.set("ie", "utf8");

  return url.toString();
}

function looksLikeSecurityPage(
  html: string,
) {
  const normalized =
    html.toLocaleLowerCase("ko-KR");

  const strongSignals = [
    "captcha",
    "자동입력 방지",
    "비정상적인 접근",
    "비정상적인 요청",
    "접근이 일시적으로 제한",
    "서비스 이용이 제한",
  ];

  const hasStrongSignal =
    strongSignals.some((needle) =>
      normalized.includes(
        needle.toLocaleLowerCase("ko-KR"),
      ),
    );

  if (!hasStrongSignal) {
    return false;
  }

  const candidates = extractCandidates(
    html,
    "INTEGRATED",
  );

  return candidates.length === 0;
}

async function fetchWithHttp(
  url: string,
  input: SerpSearchInput,
) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        input.device === "MOBILE"
          ? MOBILE_USER_AGENT
          : DESKTOP_USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language":
        "ko-KR,ko;q=0.9",
      Referer: "https://www.naver.com/",
    },
    redirect: "follow",
    cache: "no-store",
    signal:
      AbortSignal.timeout(15_000),
  });

  const html = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    html,
  };
}

async function fetchWithBrowser(
  url: string,
  input: SerpSearchInput,
): Promise<SearchFetchResult> {
  const captured =
    await captureUrlWithLocalBrowser(
      url,
      input.device,
    );

  if (
    looksLikeSecurityPage(captured.html)
  ) {
    throw new Error(
      "Naver 검색을 로컬 Chrome으로 열었지만 보안 확인/접근 제한 페이지가 반환되었습니다. CAPTCHA나 제한을 우회하지 않고 중단했습니다.",
    );
  }

  return {
    url,
    html: captured.html,
    provider:
      "NAVER_LOCAL_BROWSER_DOM",
  };
}

async function fetchSearchPage(
  input: SerpSearchInput,
  mode: "INTEGRATED" | "VIEW",
): Promise<SearchFetchResult> {
  const url = buildSearchUrl(
    input,
    mode,
  );

  try {
    const httpResult =
      await fetchWithHttp(
        url,
        input,
      );

    const httpCandidates =
      extractCandidates(
        httpResult.html,
        mode === "INTEGRATED"
          ? "INTEGRATED"
          : "VIEW_FALLBACK",
      );

    const needsBrowser =
      !httpResult.ok ||
      looksLikeSecurityPage(
        httpResult.html,
      ) ||
      httpCandidates.length === 0;

    if (!needsBrowser) {
      return {
        url,
        html: httpResult.html,
        provider:
          "NAVER_HTTP_HTML",
      };
    }
  } catch {
    // Direct HTTP is best-effort only.
    // Try a normal local Chrome DOM capture next.
  }

  try {
    return await fetchWithBrowser(
      url,
      input,
    );
  } catch (browserError) {
    const message =
      browserError instanceof Error
        ? browserError.message
        : "로컬 Chrome 검색 캡처 실패";

    throw new Error(
      `Naver 검색 자동 수집에 실패했습니다. 직접 HTTP 요청이 제한되거나 검색 HTML을 읽지 못해 로컬 Chrome으로 다시 시도했지만 성공하지 못했습니다. ${message}`,
    );
  }
}

export class NaverIntegratedSearchProvider
  implements SerpProvider
{
  async search(
    input: SerpSearchInput,
  ): Promise<SerpSnapshot> {
    const integrated =
      await fetchSearchPage(
        input,
        "INTEGRATED",
      );

    const integratedCandidates =
      extractCandidates(
        integrated.html,
        "INTEGRATED",
      );

    const combined = [
      ...integratedCandidates,
    ];

    const providers = new Set<
      SearchProviderName
    >([integrated.provider]);

    let responseMaterial =
      integrated.html;

    if (
      combined.length <
        INTEGRATED_TARGET &&
      combined.length < MAX_CANDIDATES
    ) {
      const view =
        await fetchSearchPage(
          input,
          "VIEW",
        );

      providers.add(view.provider);

      responseMaterial +=
        `\n${view.html}`;

      const fallbackCandidates =
        extractCandidates(
          view.html,
          "VIEW_FALLBACK",
        );

      const seen = new Set(
        combined.map(
          (item) =>
            item.normalizedUrl,
        ),
      );

      for (
        const candidate of
        fallbackCandidates
      ) {
        if (
          seen.has(
            candidate.normalizedUrl,
          )
        ) {
          continue;
        }

        seen.add(
          candidate.normalizedUrl,
        );
        combined.push(candidate);

        if (
          combined.length >=
          MAX_CANDIDATES
        ) {
          break;
        }
      }
    }

    if (combined.length === 0) {
      throw new Error(
        "Naver 검색 페이지는 열렸지만 Naver Blog 글 후보를 찾지 못했습니다. 검색 화면 구조가 바뀌었을 가능성이 있어 SERP Parser 확인이 필요합니다.",
      );
    }

    const results: SerpResult[] =
      combined
        .slice(0, MAX_CANDIDATES)
        .map(
          (candidate, index) => ({
            rank: index + 1,
            title:
              candidate.title,
            url: candidate.url,
            normalizedUrl:
              candidate.normalizedUrl,
            origin:
              candidate.origin,
            included: index < 7,
          }),
        );

    return {
      keyword: input.keyword,
      device: input.device,
      capturedAt:
        new Date().toISOString(),
      provider:
        Array.from(providers).join(
          "+",
        ),
      searchUrl: integrated.url,
      responseHash:
        createHash("sha256")
          .update(responseMaterial)
          .digest("hex"),
      results,
    };
  }
}
