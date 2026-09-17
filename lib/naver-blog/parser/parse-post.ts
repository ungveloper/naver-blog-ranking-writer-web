import * as cheerio from "cheerio";
import type {
  FetchedNaverBlogPost,
  NaverBlogPostData,
} from "@/lib/naver-blog/parser/types";
import { toAbsoluteUrl } from "@/lib/naver-blog/parser/url";

function normalizeWhitespace(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTitle(
  $: cheerio.CheerioAPI,
  html: string,
) {
  const candidates = [
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="title"]').attr("content"),
    $(".se-title-text span").first().text(),
    $(".pcol1 .htitle").first().text(),
    $("title").first().text(),
  ];

  for (const item of candidates) {
    const value = (item || "")
      .replace(/\s+/g, " ")
      .trim();

    if (value) {
      return value;
    }
  }

  const regexMatch = html.match(
    /<meta property="og:title" content="([^"]+)"/i,
  );

  return regexMatch?.[1]?.trim() || "제목을 추출하지 못했습니다.";
}

function getPostRoot($: cheerio.CheerioAPI) {
  const selectors = [
    ".se-main-container",
    "#postViewArea",
    ".post-view",
    ".view",
  ];

  for (const selector of selectors) {
    const root = $(selector).first();

    if (root.length > 0) {
      return root;
    }
  }

  return null;
}

function normalizeImageUrl(
  rawUrl: string,
  baseUrl: string,
) {
  const absolute = toAbsoluteUrl(
    baseUrl,
    rawUrl.replace(/&amp;/g, "&").trim(),
  );

  if (!absolute) {
    return "";
  }

  try {
    const url = new URL(absolute);
    const encodedSrc = url.searchParams.get("src");

    if (encodedSrc) {
      try {
        return normalizeImageUrl(
          decodeURIComponent(encodedSrc),
          baseUrl,
        );
      } catch {
        // fall through
      }
    }

    url.searchParams.delete("type");
    url.searchParams.delete("w");
    url.searchParams.delete("h");
    url.searchParams.delete("size");

    return url.toString();
  } catch {
    return absolute;
  }
}

function isSkippableImageUrl(url: string) {
  return (
    url.includes("ssl.pstatic.net/static") ||
    url.includes("/favicon.ico") ||
    url.includes("blank.gif")
  );
}

function extractImages(
  $: cheerio.CheerioAPI,
  baseUrl: string,
) {
  const root = getPostRoot($);
  const target = root ?? $.root();
  const images = new Map<string, string>();

  const add = (raw?: string | null) => {
    if (!raw) {
      return;
    }

    const normalized = normalizeImageUrl(raw, baseUrl);

    if (!normalized || isSkippableImageUrl(normalized)) {
      return;
    }

    try {
      const parsed = new URL(normalized);
      const key = `${parsed.origin}${parsed.pathname}`;
      images.set(key, normalized);
    } catch {
      images.set(normalized, normalized);
    }
  };

  target.find("img").each((_, element) => {
    const node = $(element);

    add(node.attr("data-lazy-src"));
    add(node.attr("data-src"));
    add(node.attr("data-lw_src"));
    add(node.attr("src"));
  });

  return Array.from(images.values());
}

function removeNoise($: cheerio.CheerioAPI) {
  $(
    "script, style, noscript, iframe, svg, canvas, button, input, textarea, select, option",
  ).remove();

  $(
    ".se-component.se-oglink, .se-section-oglink, .se-module-oglink, .se-oglink-thumbnail, .se-oglink-info, .se-oglink-info-container",
  ).remove();

  $('[data-module*="oglink"], [data-module-v2*="oglink"]').remove();
  $("#_photo_view_property").remove();
}

function extractContentText(
  original$: cheerio.CheerioAPI,
  html: string,
  imageCount: number,
) {
  const root = getPostRoot(original$);
  const targetHtml = root ? original$.html(root) : html;
  const $ = cheerio.load(targetHtml);

  removeNoise($);

  $("br").replaceWith("\n");
  $("hr").replaceWith(
    "\n----------------------------------------\n",
  );

  let imageIndex = 0;

  $("img, picture, video").each((_, element) => {
    imageIndex += 1;

    if (imageIndex <= imageCount) {
      $(element).replaceWith(
        `\n(이미지-${String(imageIndex).padStart(3, "0")})\n`,
      );
    } else {
      $(element).remove();
    }
  });

  $("li").each((_, element) => {
    const node = $(element);

    if (node.text().trim()) {
      node.prepend("• ");
      node.append("\n");
    }
  });

  $("td, th").each((_, element) => {
    const node = $(element);

    if (node.text().trim()) {
      node.append("\t");
    }
  });

  $("tr").each((_, element) => {
    const node = $(element);

    if (node.text().trim()) {
      node.append("\n");
    }
  });

  $(
    "p, div, section, article, header, footer, aside, blockquote, figcaption, h1, h2, h3, h4, h5, h6, ul, ol, table, pre",
  ).each((_, element) => {
    const node = $(element);

    if (node.text().trim()) {
      node.append("\n");
    }
  });

  return (
    normalizeWhitespace($.root().text()) ||
    "본문을 추출하지 못했습니다."
  );
}

function extractContentHtml(
  original$: cheerio.CheerioAPI,
  html: string,
) {
  const root = getPostRoot(original$);
  const targetHtml = root ? original$.html(root) : html;
  const $ = cheerio.load(targetHtml);

  removeNoise($);

  const bodyHtml = $.root().html()?.trim();

  return bodyHtml || "<p>본문을 추출하지 못했습니다.</p>";
}

function extractPublishedAt($: cheerio.CheerioAPI) {
  const metaCandidates = [
    $('meta[property="article:published_time"]').attr("content"),
    $('meta[property="og:regDate"]').attr("content"),
  ];

  for (const candidate of metaCandidates) {
    if (!candidate) {
      continue;
    }

    const parsed = new Date(candidate);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const visibleCandidates = [
    $(".se_publishDate").first().text(),
    $(".date.fil5.pcol2").first().text(),
  ];

  for (const candidate of visibleCandidates) {
    const value = candidate.trim();

    if (!value) {
      continue;
    }

    const normalized = value
      .replace(/\./g, "-")
      .replace(/\s+/g, " ")
      .trim();

    const match = normalized.match(
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
    );

    if (match) {
      const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
      );

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  return null;
}

export function parseNaverBlogPost(
  fetched: FetchedNaverBlogPost,
): NaverBlogPostData {
  const $ = cheerio.load(fetched.html);
  const images = extractImages($, fetched.resolvedUrl);

  return {
    title: extractTitle($, fetched.html),
    images,
    contentText: extractContentText(
      $,
      fetched.html,
      images.length,
    ),
    contentHtml: extractContentHtml($, fetched.html),
    sourceUrl: fetched.sourceUrl,
    resolvedUrl: fetched.resolvedUrl,
    publishedAt: extractPublishedAt($),
  };
}
