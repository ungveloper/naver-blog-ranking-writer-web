import { createHash } from "node:crypto";
import { dbPool } from "@/lib/db/pool";
import {
  ARTICLE_FEATURE_EXTRACTOR_VERSION,
  extractArticleFeatures,
  type ArticleFeatures,
} from "@/lib/analysis/article-features";
import {
  getNaverBlogPostData,
  NAVER_BLOG_PARSER_VERSION,
  type NaverBlogPostData,
} from "@/lib/naver-blog/parser";

export type BenchmarkDocument = {
  sourceDocumentId: string;
  position: number;
  title: string;
  sourceUrl: string;
  canonicalUrl: string;
  imageCount: number;
  capturedAt: string;
  features: ArticleFeatures;
};

type ProjectPermissionRow = {
  primary_keyword: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
};

type BenchmarkRow = {
  source_document_id: string;
  position: number;
  title: string;
  source_url: string;
  canonical_url: string;
  image_urls: string[];
  captured_at: string;
  features: ArticleFeatures;
};

function sleep(milliseconds: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
}

function contentHash(post: NaverBlogPostData) {
  return createHash("sha256")
    .update(
      `${post.title}\n${post.contentText}\n${post.resolvedUrl}`,
    )
    .digest("hex");
}

async function getProjectPermission(
  userId: string,
  projectId: string,
) {
  const result = await dbPool.query<ProjectPermissionRow>(
    `
      select
        cp.primary_keyword,
        hm.role
      from content_projects cp
      join hospital_members hm
        on hm.hospital_id = cp.hospital_id
       and hm.user_id = $1
      where cp.id = $2
        and cp.status = 'ACTIVE'
      limit 1
    `,
    [userId, projectId],
  );

  return result.rows[0] ?? null;
}

export async function importManualBenchmark(
  userId: string,
  projectId: string,
  urls: string[],
) {
  const permission = await getProjectPermission(
    userId,
    projectId,
  );

  if (
    !permission ||
    !["OWNER", "EDITOR"].includes(permission.role)
  ) {
    throw new Error("BENCHMARK_IMPORT_FORBIDDEN");
  }

  const parsedPosts: NaverBlogPostData[] = [];

  for (const [index, url] of urls.entries()) {
    try {
      parsedPosts.push(
        await getNaverBlogPostData(url),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 파싱 오류";

      throw new Error(
        `${index + 1}번째 URL 파싱 실패: ${message}`,
      );
    }

    if (index < urls.length - 1) {
      await sleep(250);
    }
  }

  const client = await dbPool.connect();

  try {
    await client.query("begin");

    await client.query(
      `
        delete from project_benchmarks
        where project_id = $1
      `,
      [projectId],
    );

    for (const [index, post] of parsedPosts.entries()) {
      const features = extractArticleFeatures(
        post,
        permission.primary_keyword,
      );

      const sourceResult = await client.query<{
        id: string;
      }>(
        `
          insert into source_documents (
            project_id,
            source_url,
            canonical_url,
            title,
            content_text,
            content_html,
            image_urls,
            published_at,
            content_hash,
            parser_version,
            captured_at
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7::jsonb,
            $8::timestamptz,
            $9,
            $10,
            now()
          )
          on conflict (project_id, canonical_url)
          do update set
            source_url = excluded.source_url,
            title = excluded.title,
            content_text = excluded.content_text,
            content_html = excluded.content_html,
            image_urls = excluded.image_urls,
            published_at = excluded.published_at,
            content_hash = excluded.content_hash,
            parser_version = excluded.parser_version,
            captured_at = now(),
            updated_at = now()
          returning id
        `,
        [
          projectId,
          post.sourceUrl,
          post.resolvedUrl,
          post.title,
          post.contentText,
          post.contentHtml,
          JSON.stringify(post.images),
          post.publishedAt,
          contentHash(post),
          NAVER_BLOG_PARSER_VERSION,
        ],
      );

      const sourceDocumentId =
        sourceResult.rows[0].id;

      await client.query(
        `
          insert into project_benchmarks (
            project_id,
            source_document_id,
            position,
            included
          )
          values ($1, $2, $3, true)
          on conflict (project_id, source_document_id)
          do update set
            position = excluded.position,
            included = true,
            exclusion_reason = null,
            updated_at = now()
        `,
        [projectId, sourceDocumentId, index + 1],
      );

      await client.query(
        `
          insert into article_features (
            project_id,
            source_document_id,
            extractor_version,
            features
          )
          values ($1, $2, $3, $4::jsonb)
          on conflict (source_document_id)
          do update set
            extractor_version = excluded.extractor_version,
            features = excluded.features,
            updated_at = now()
        `,
        [
          projectId,
          sourceDocumentId,
          ARTICLE_FEATURE_EXTRACTOR_VERSION,
          JSON.stringify(features),
        ],
      );
    }

    await client.query(
      `
        update content_projects
        set
          workflow_stage = 'ARTICLE_ANALYSIS',
          updated_at = now()
        where id = $1
      `,
      [projectId],
    );

    await client.query("commit");

    return parsedPosts.length;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listBenchmarksForProject(
  userId: string,
  projectId: string,
): Promise<BenchmarkDocument[]> {
  const permission = await getProjectPermission(
    userId,
    projectId,
  );

  if (!permission) {
    return [];
  }

  const result = await dbPool.query<BenchmarkRow>(
    `
      select
        sd.id as source_document_id,
        pb.position,
        sd.title,
        sd.source_url,
        sd.canonical_url,
        sd.image_urls,
        sd.captured_at::text,
        af.features
      from project_benchmarks pb
      join source_documents sd
        on sd.id = pb.source_document_id
      join article_features af
        on af.source_document_id = sd.id
      where pb.project_id = $1
        and pb.included = true
      order by pb.position
    `,
    [projectId],
  );

  return result.rows.map((row) => ({
    sourceDocumentId: row.source_document_id,
    position: row.position,
    title: row.title,
    sourceUrl: row.source_url,
    canonicalUrl: row.canonical_url,
    imageCount: Array.isArray(row.image_urls)
      ? row.image_urls.length
      : 0,
    capturedAt: row.captured_at,
    features: row.features,
  }));
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round(
      (sorted[middle - 1] + sorted[middle]) / 2,
    );
  }

  return sorted[middle];
}

export function summarizeBenchmarks(
  benchmarks: BenchmarkDocument[],
) {
  if (benchmarks.length === 0) {
    return null;
  }

  const lengths = benchmarks.map(
    (item) => item.features.totalTextLength,
  );
  const imageCounts = benchmarks.map(
    (item) => item.features.imageCount,
  );
  const keywordCounts = benchmarks.map(
    (item) => item.features.exactKeywordCount,
  );
  const titleMatches = benchmarks.filter(
    (item) => item.features.exactKeywordInTitle,
  ).length;

  return {
    count: benchmarks.length,
    textLengthMedian: median(lengths),
    textLengthMin: Math.min(...lengths),
    textLengthMax: Math.max(...lengths),
    imageCountMedian: median(imageCounts),
    imageCountMin: Math.min(...imageCounts),
    imageCountMax: Math.max(...imageCounts),
    keywordCountMedian: median(keywordCounts),
    keywordCountMin: Math.min(...keywordCounts),
    keywordCountMax: Math.max(...keywordCounts),
    titleKeywordMatchCount: titleMatches,
  };
}
