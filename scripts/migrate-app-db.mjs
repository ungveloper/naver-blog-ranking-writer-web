import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL이 없습니다. .env.local을 먼저 설정하세요.");
  process.exit(1);
}

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260917_001_hospital_access.sql",
);
const sql = await fs.readFile(migrationPath, "utf8");
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log("✅ 앱 DB 마이그레이션 완료");
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error("❌ 앱 DB 마이그레이션 실패");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
