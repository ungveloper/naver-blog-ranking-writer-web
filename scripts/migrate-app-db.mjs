import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DIRECT_URL 또는 DATABASE_URL이 없습니다.");
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const migrationFiles = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();

  for (const file of migrationFiles) {
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("commit");
      console.log(`✅ ${file}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  console.log("✅ 앱 DB 마이그레이션 완료");
} catch (error) {
  console.error("❌ 앱 DB 마이그레이션 실패");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
