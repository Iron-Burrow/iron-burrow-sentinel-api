import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface SentinelEnv {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  DATABASE_URL: string;
  API_KEY_HASH_SECRET: string;
  SESSION_SECRET: string;
  RATE_LIMIT_WINDOW_SECONDS: number;
  RATE_LIMIT_REQUESTS: number;
  RATE_LIMIT_COST_UNITS: number;
}

function loadOptionalEnvFile(filePath = ".env"): void {
  try {
    const contents = readFileSync(resolve(filePath), "utf8");

    for (const rawLine of contents.split(/\r?\n/u)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const normalized = line.startsWith("export ") ? line.slice(7) : line;
      const separatorIndex = normalized.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const key = normalized.slice(0, separatorIndex).trim();
      let value = normalized.slice(separatorIndex + 1).trim();

      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Local env files are optional; explicit process env wins.
  }
}

function readPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : fallback;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readString(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

function readNodeEnv(): SentinelEnv["NODE_ENV"] {
  const value = process.env.NODE_ENV;
  return value === "test" || value === "production" ? value : "development";
}

export function loadEnv(): SentinelEnv {
  loadOptionalEnvFile();

  return {
    NODE_ENV: readNodeEnv(),
    PORT: readPositiveInteger("PORT", 3000),
    DATABASE_URL: readString("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/iron_burrow_sentinel"),
    API_KEY_HASH_SECRET: readString("API_KEY_HASH_SECRET", "dev-sentinel-api-key-hash-secret-change-me"),
    SESSION_SECRET: readString("SESSION_SECRET", "dev-sentinel-session-secret-change-me"),
    RATE_LIMIT_WINDOW_SECONDS: readPositiveInteger("RATE_LIMIT_WINDOW_SECONDS", 60),
    RATE_LIMIT_REQUESTS: readPositiveInteger("RATE_LIMIT_REQUESTS", 60),
    RATE_LIMIT_COST_UNITS: readPositiveInteger("RATE_LIMIT_COST_UNITS", 600)
  };
}
