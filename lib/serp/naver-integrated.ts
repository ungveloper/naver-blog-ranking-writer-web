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
  type SerpSearchInput,
  type SerpSnapshot,
} from "@/lib/serp/provider";

const MAX_CANDIDATES = 10;

const MOBILE_USER_AGENT =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36";

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

type SearchProviderName =
  | "NAVER_HTTP_INTEGRATED"
  | "NAVER_LOCAL_BROWSER_INTEGRATED";

type SearchFetchResult = {
  url: string;
  html: string;
  provider: SearchProviderName;
};

type IntegratedCandidate = {
  title: string;
  url: string;
  normalizedUrl: string;
  sectionArea?: string;
  blockId?: string;
  domIndex: number;
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
        candidates.add(value);
        candidates.add(
          decodeRepeatedly(value),
        );
      }
    } catch {
      // Naver 속성에는 완전한 URL이 아닌 값도 들어간다.
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

  const headline = normalizeText(
    anchor
      .find(
        ".sds-comps-text-type-headline1, [data-template-id='title']",
      )
      .first()
      .text(),
  );

  if (headline.length >= 4) {
    return headline.slice(0, 180);
  }

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
    "[data-template-id='ugcItem'], li, article, .api_subject_bx, .fds-web-doc-root",
  );

  const parentHeadline = normalizeText(
    parent
      .find(".sds-comps-text-type-headline1")
      .first()
      .text(),
  );

  if (parentHeadline.length >= 4) {
    return parentHeadline.slice(0, 180);
  }

  return `Naver 통합검색 Blog 결과 ${fallbackRank}`;
}

function collectPostAnchorsFromRoot(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<Element>,
  domIndex: number,
) {
  const found = new Map<
    string,
    IntegratedCandidate
  >();

  root.find("a").each((_, element) => {
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
      found.size + 1,
    );

    const existing =
      found.get(normalizedUrl);

    if (
      !existing ||
      title.length > existing.title.length
    ) {
      found.set(normalizedUrl, {
        title,
        url: normalizedUrl,
        normalizedUrl,
        sectionArea:
          root.attr("data-meta-area") ||
          undefined,
        blockId:
          root.attr("data-block-id") ||
          undefined,
        domIndex,
      });
    }
  });

  return Array.from(found.values());
}

function extractIntegratedBlogCandidates(
  html: string,
) {
  const $ = cheerio.load(html);
  const roots = $(
    "[data-fender-root='true']",
  );

  const ordered: IntegratedCandidate[] = [];
  const seen = new Set<string>();

  roots.each((rootIndex, rootElement) => {
    const root = $(rootElement);

    // 이 페이지 자체가 Naver 통합검색 URL이므로,
    // FENDER root 안에서 '실제 Naver Blog 게시글 URL'만 뽑는다.
    // 첨부 HTML의 data-meta-ssc=tab.nx.all / review_blog_rra / web_basic
    // 등 세부 템플릿 이름은 기록하되 특정 템플릿 하나에 종속하지 않는다.
    const rootCandidates =
      collectPostAnchorsFromRoot(
        $,
        root,
        rootIndex + 1,
      );

    for (const candidate of rootCandidates) {
      if (
        seen.has(candidate.normalizedUrl)
      ) {
        continue;
      }

      seen.add(candidate.normalizedUrl);
      ordered.push(candidate);

      if (
        ordered.length >= MAX_CANDIDATES
      ) {
        return false;
      }
    }
  });

  if (ordered.length > 0) {
    return ordered;
  }

  // Naver가 FENDER root 표기를 바꾼 경우의 제한적 호환.
  // 여전히 '현재 통합검색 페이지 내부'의 실제 Blog 게시글만 허용한다.
  const fallbackRoot =
    $.root() as unknown as cheerio.Cheerio<Element>;

  return collectPostAnchorsFromRoot(
    $,
    fallbackRoot,
    1,
  ).slice(0, MAX_CANDIDATES);
}

function buildIntegratedSearchUrl(
  input: SerpSearchInput,
) {
  const mobile =
    input.device === "MOBILE";

  const base = mobile
    ? "https://m.search.naver.com/search.naver"
    : "https://search.naver.com/search.naver";

  const url = new URL(base);

  url.searchParams.set(
    "where",
    mobile ? "m" : "nexearch",
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

  return (
    extractIntegratedBlogCandidates(html)
      .length === 0
  );
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

  return {
    ok: response.ok,
    status: response.status,
    html: await response.text(),
  };
}

async function fetchIntegratedPage(
  input: SerpSearchInput,
): Promise<SearchFetchResult> {
  const url =
    buildIntegratedSearchUrl(input);

  try {
    const httpResult =
      await fetchWithHttp(
        url,
        input,
      );

    const candidates =
      extractIntegratedBlogCandidates(
        httpResult.html,
      );

    if (
      httpResult.ok &&
      !looksLikeSecurityPage(
        httpResult.html,
      ) &&
      candidates.length > 0
    ) {
      return {
        url,
        html: httpResult.html,
        provider:
          "NAVER_HTTP_INTEGRATED",
      };
    }
  } catch {
    // 직접 HTTP는 best-effort.
  }

  try {
    const captured =
      await captureUrlWithLocalBrowser(
        url,
        input.device,
      );

    if (
      looksLikeSecurityPage(
        captured.html,
      )
    ) {
      throw new Error(
        "Naver 통합검색을 로컬 Chrome으로 열었지만 보안 확인/접근 제한 페이지가 반환되었습니다.",
      );
    }

    return {
      url,
      html: captured.html,
      provider:
        "NAVER_LOCAL_BROWSER_INTEGRATED",
    };
  } catch (browserError) {
    const message =
      browserError instanceof Error
        ? browserError.message
        : "로컬 Chrome 통합검색 캡처 실패";

    throw new Error(
      `Naver 통합검색 Blog 영역 수집에 실패했습니다. CAPTCHA나 접근 제한을 우회하지 않습니다. ${message}`,
    );
  }
}

export class NaverIntegratedSearchProvider
  implements SerpProvider
{
  async search(
    input: SerpSearchInput,
  ): Promise<SerpSnapshot> {
    const page =
      await fetchIntegratedPage(input);

    const candidates =
      extractIntegratedBlogCandidates(
        page.html,
      );

    if (candidates.length === 0) {
      throw new Error(
        "Naver 통합검색 페이지는 열렸지만 통합검색 안에서 실제 Naver Blog 게시글을 찾지 못했습니다.",
      );
    }

    const results: SerpResult[] =
      candidates.map(
        (candidate, index) => ({
          rank: index + 1,
          title: candidate.title,
          url: candidate.url,
          normalizedUrl:
            candidate.normalizedUrl,
          origin: "INTEGRATED",
          included: index < 7,
          sectionArea:
            candidate.sectionArea,
          blockId:
            candidate.blockId,
          domIndex:
            candidate.domIndex,
        }),
      );

    return {
      keyword: input.keyword,
      device: input.device,
      capturedAt:
        new Date().toISOString(),
      provider: page.provider,
      searchUrl: page.url,
      responseHash:
        createHash("sha256")
          .update(page.html)
          .digest("hex"),
      results,
    };
  }
}
