import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { closeDbPool, getDbPool } from "./client.js";
import { loadEnv } from "../env.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(currentDir, "../../migrations");

export async function runMigrations(connectionString: string): Promise<void> {
  const pool = getDbPool(connectionString);
  const files = (await readdir(migrationsDir)).filter((fileName) => fileName.endsWith(".sql")).sort();

  for (const fileName of files) {
    const sql = await readFile(path.join(migrationsDir, fileName), "utf8");
    await pool.query(sql);
    console.log(`[db] applied ${fileName}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = loadEnv();
  await runMigrations(env.DATABASE_URL);
  await closeDbPool();
  console.log("[db] migrations applied");
}
