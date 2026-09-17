export const NAVER_BLOG_PARSER_VERSION =
  "naver-blog-parser-v1";

export type NaverBlogPostData = {
  title: string;
  images: string[];
  contentText: string;
  contentHtml: string;
  sourceUrl: string;
  resolvedUrl: string;
  publishedAt: string | null;
};

export type FetchedNaverBlogPost = {
  sourceUrl: string;
  resolvedUrl: string;
  html: string;
};
