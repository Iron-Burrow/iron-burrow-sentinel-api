import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const HASH_SECRET =
  process.env.API_KEY_HASH_SECRET || "dev-sentinel-api-key-hash-secret-change-me";

export function generateApiKey(mode: "test" | "live" = "test"): string {
  return `ibs_${mode}_${randomBytes(24).toString("base64url")}`;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 18);
}

export function hashApiKey(apiKey: string): string {
  return createHmac("sha256", HASH_SECRET).update(apiKey).digest("hex");
}

export function hashesMatch(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
