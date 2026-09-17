import * as cheerio from "cheerio";
import type { NaverBlogPostData } from "@/lib/naver-blog/parser";

export const ARTICLE_FEATURE_EXTRACTOR_VERSION =
  "article-features-v1";

export type ArticleFeatures = {
  titleLength: number;
  totalTextLength: number;
  paragraphCount: number;
  averageParagraphLength: number;
  imageCount: number;
  firstImagePosition: number | null;
  exactKeywordInTitle: boolean;
  exactKeywordTitlePosition: number | null;
  exactKeywordCount: number;
  exactKeywordFirst300Count: number;
  firstKeywordPosition: number | null;
  questionMarkCount: number;
  numericExpressionCount: number;
  headingCount: number;
  listItemCount: number;
  tableCount: number;
  publishedAt: string | null;
};

function countOccurrences(
  text: string,
  keyword: string,
) {
  const haystack = text.toLocaleLowerCase("ko-KR");
  const needle = keyword
    .trim()
    .toLocaleLowerCase("ko-KR");

  if (!needle) {
    return 0;
  }

  return haystack.split(needle).length - 1;
}

function textLength(value: string) {
  return Array.from(value).length;
}

export function extractArticleFeatures(
  post: NaverBlogPostData,
  primaryKeyword: string,
): ArticleFeatures {
  const keyword = primaryKeyword.trim();
  const normalizedText = post.contentText
    .replace(/\(이미지-\d{3}\)/g, "")
    .trim();

  const paragraphs = normalizedText
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const paragraphLengths = paragraphs.map(textLength);
  const paragraphTotal = paragraphLengths.reduce(
    (sum, current) => sum + current,
    0,
  );

  const titleKeywordPosition = post.title
    .toLocaleLowerCase("ko-KR")
    .indexOf(keyword.toLocaleLowerCase("ko-KR"));

  const firstKeywordPosition = normalizedText
    .toLocaleLowerCase("ko-KR")
    .indexOf(keyword.toLocaleLowerCase("ko-KR"));

  const firstImagePosition = post.contentText.indexOf(
    "(이미지-001)",
  );

  const $ = cheerio.load(post.contentHtml);

  return {
    titleLength: textLength(post.title),
    totalTextLength: textLength(normalizedText),
    paragraphCount: paragraphs.length,
    averageParagraphLength:
      paragraphs.length > 0
        ? Math.round(paragraphTotal / paragraphs.length)
        : 0,
    imageCount: post.images.length,
    firstImagePosition:
      firstImagePosition >= 0 ? firstImagePosition : null,
    exactKeywordInTitle: titleKeywordPosition >= 0,
    exactKeywordTitlePosition:
      titleKeywordPosition >= 0
        ? titleKeywordPosition
        : null,
    exactKeywordCount: countOccurrences(
      normalizedText,
      keyword,
    ),
    exactKeywordFirst300Count: countOccurrences(
      Array.from(normalizedText).slice(0, 300).join(""),
      keyword,
    ),
    firstKeywordPosition:
      firstKeywordPosition >= 0
        ? firstKeywordPosition
        : null,
    questionMarkCount:
      (normalizedText.match(/[?？]/g) || []).length,
    numericExpressionCount:
      (
        normalizedText.match(
          /\d[\d,.]*(?:\s?(?:%|원|회|년|개월|일|분|시간|cm|mm|kg|명))?/gi,
        ) || []
      ).length,
    headingCount: $("h1, h2, h3, h4, h5, h6").length,
    listItemCount: $("li").length,
    tableCount: $("table").length,
    publishedAt: post.publishedAt,
  };
}
