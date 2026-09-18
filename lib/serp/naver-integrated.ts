import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import {
  captureUrlWithLocalBrowser,
} from "@/lib/serp/browser-capture";
import {
  isNaverBlogPostUrl,
  normalizeNaverBlogUrl,
  type SerpProvider,
  type SerpResult,
  type SerpSearchInput,
  type SerpSectionKind,
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
  snippet: string;
  sourceName: string;
  url: string;
  normalizedUrl: string;
  sectionArea?: string;
  blockId?: string;
  domIndex: number;
  sectionKind: SerpSectionKind;
  titleScore: number;
};

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanPresentationText(value: string) {
  return normalizeText(value)
    .replace(/새 창 열림/g, " ")
    .replace(/Keep에 저장/g, " ")
    .replace(/Keep에 바로가기/g, " ")
    .replace(/옵션 메뉴 열기/g, " ")
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

function getCard(
  $: cheerio.CheerioAPI,
  element: AnyNode,
) {
  const anchor = $(element);

  const card = anchor.closest(
    [
      "[data-template-id='ugcItem']",
      ".fds-web-doc-root",
      "article",
      "li",
      ".api_subject_bx",
    ].join(", "),
  );

  return card.length > 0 ? card : anchor;
}

function getHeadlineFromCard(
  card: cheerio.Cheerio<AnyNode>,
) {
  const selectors = [
    ".sds-comps-text-type-headline1",
    "[data-template-id='title']",
  ];

  for (const selector of selectors) {
    const value = cleanPresentationText(
      card.find(selector).first().text(),
    );

    if (value.length >= 4) {
      return value.slice(0, 180);
    }
  }

  return "";
}

function getSnippetFromCard(
  $: cheerio.CheerioAPI,
  card: cheerio.Cheerio<AnyNode>,
  title: string,
) {
  const candidates = card
    .find(
      [
        ".sds-comps-text-type-body1",
        ".fds-ugc-ellipsis3",
        "[data-template-id='content']",
      ].join(", "),
    )
    .toArray()
    .map((element) =>
      cleanPresentationText($(element).text()),
    )
    .filter(
      (value) =>
        value.length >= 20 &&
        value !== title &&
        !value.startsWith(title),
    );

  if (candidates.length === 0) {
    return "";
  }

  const preferred = candidates.sort(
    (a, b) => b.length - a.length,
  )[0];

  return preferred.slice(0, 260);
}

function getSourceNameFromCard(
  card: cheerio.Cheerio<AnyNode>,
  normalizedUrl: string,
) {
  const selectors = [
    ".sds-comps-profile-info-title-text",
    "[data-template-id='articleSource'] .sds-comps-profile-info-title",
  ];

  for (const selector of selectors) {
    const value = cleanPresentationText(
      card.find(selector).first().text(),
    );

    if (value.length >= 2) {
      return value.slice(0, 80);
    }
  }

  try {
    const url = new URL(normalizedUrl);
    return (
      url.pathname
        .split("/")
        .filter(Boolean)[0] || "Naver Blog"
    );
  } catch {
    return "Naver Blog";
  }
}

function classifySection(
  blockId: string | undefined,
): SerpSectionKind {
  const value = blockId || "";

  if (
    value.includes("review_blog") ||
    value.includes("service-ugc")
  ) {
    return "REVIEW_BLOG";
  }

  if (value.includes("web/")) {
    return "WEB_BLOG";
  }

  return "OTHER";
}

function extractAnchorPresentation(
  $: cheerio.CheerioAPI,
  element: AnyNode,
  normalizedUrl: string,
  fallbackRank: number,
) {
  const anchor = $(element);
  const card = getCard($, element);
  const cardHeadline =
    getHeadlineFromCard(card);

  if (cardHeadline) {
    return {
      title: cardHeadline,
      snippet: getSnippetFromCard(
        $,
        card,
        cardHeadline,
      ),
      sourceName: getSourceNameFromCard(
        card,
        normalizedUrl,
      ),
      titleScore: 100,
    };
  }

  const ownHeadline = cleanPresentationText(
    anchor
      .find(".sds-comps-text-type-headline1")
      .first()
      .text(),
  );

  if (ownHeadline.length >= 4) {
    return {
      title: ownHeadline.slice(0, 180),
      snippet: getSnippetFromCard(
        $,
        card,
        ownHeadline,
      ),
      sourceName: getSourceNameFromCard(
        card,
        normalizedUrl,
      ),
      titleScore: 90,
    };
  }

  const attrTitle = cleanPresentationText(
    anchor.attr("title") ||
      anchor.attr("aria-label") ||
      "",
  );

  if (
    attrTitle.length >= 4 &&
    attrTitle.length <= 180
  ) {
    return {
      title: attrTitle,
      snippet: getSnippetFromCard(
        $,
        card,
        attrTitle,
      ),
      sourceName: getSourceNameFromCard(
        card,
        normalizedUrl,
      ),
      titleScore: 60,
    };
  }

  const directText = cleanPresentationText(
    anchor.text(),
  );

  if (
    directText.length >= 4 &&
    directText.length <= 180
  ) {
    return {
      title: directText,
      snippet: getSnippetFromCard(
        $,
        card,
        directText,
      ),
      sourceName: getSourceNameFromCard(
        card,
        normalizedUrl,
      ),
      titleScore: 40,
    };
  }

  return {
    title: `Naver 통합검색 Blog 결과 ${fallbackRank}`,
    snippet: getSnippetFromCard(
      $,
      card,
      "",
    ),
    sourceName: getSourceNameFromCard(
      card,
      normalizedUrl,
    ),
    titleScore: 1,
  };
}

function collectPostAnchorsFromRoot(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  domIndex: number,
) {
  const found = new Map<
    string,
    IntegratedCandidate
  >();

  const blockId =
    root.attr("data-block-id") ||
    undefined;

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

    const presentation =
      extractAnchorPresentation(
        $,
        element,
        normalizedUrl,
        found.size + 1,
      );

    const candidate: IntegratedCandidate = {
      ...presentation,
      url: normalizedUrl,
      normalizedUrl,
      sectionArea:
        root.attr("data-meta-area") ||
        undefined,
      blockId,
      domIndex,
      sectionKind:
        classifySection(blockId),
    };

    const existing =
      found.get(normalizedUrl);

    if (
      !existing ||
      candidate.titleScore >
        existing.titleScore
    ) {
      found.set(normalizedUrl, candidate);
      return;
    }

    if (
      existing.titleScore ===
        candidate.titleScore &&
      !existing.snippet &&
      candidate.snippet
    ) {
      found.set(normalizedUrl, {
        ...existing,
        snippet: candidate.snippet,
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

  const fallbackRoot =
    $.root() as unknown as cheerio.Cheerio<AnyNode>;

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
          snippet:
            candidate.snippet ||
            undefined,
          sourceName:
            candidate.sourceName ||
            undefined,
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
          sectionKind:
            candidate.sectionKind,
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
