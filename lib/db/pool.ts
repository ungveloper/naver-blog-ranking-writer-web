import { Pool } from "pg";

const BUILD_ONLY_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

declare global {
  var __naverBlogRankingWriterPool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString:
      process.env.DATABASE_URL || BUILD_ONLY_DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    application_name: "naver-blog-ranking-writer-web",
  });
}

export const dbPool =
  globalThis.__naverBlogRankingWriterPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.__naverBlogRankingWriterPool = dbPool;
}
