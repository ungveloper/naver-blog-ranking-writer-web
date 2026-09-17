import process from "node:process";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DIRECT_URL 또는 DATABASE_URL이 없습니다.");
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["auth@latest", "migrate", "--yes"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
