import { fetchNaverBlogPost } from "@/lib/naver-blog/parser/fetch-post";
import { parseNaverBlogPost } from "@/lib/naver-blog/parser/parse-post";
import type { NaverBlogPostData } from "@/lib/naver-blog/parser/types";

export {
  NAVER_BLOG_PARSER_VERSION,
  type NaverBlogPostData,
} from "@/lib/naver-blog/parser/types";

export async function getNaverBlogPostData(
  inputUrl: string,
): Promise<NaverBlogPostData> {
  const fetched = await fetchNaverBlogPost(inputUrl);
  return parseNaverBlogPost(fetched);
}
