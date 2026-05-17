import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { query } from "./client.js";

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  status: "active" | "revoked";
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface PublicApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  status: "active" | "revoked";
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  status: "active" | "revoked";
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

function mapApiKey(row: ApiKeyRow): ApiKeyRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    keyHash: row.key_hash,
    status: row.status,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at
  };
}

export function toPublicApiKey(key: ApiKeyRecord): PublicApiKeyRecord {
  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    keyPrefix: key.keyPrefix,
    status: key.status,
    lastUsedAt: key.lastUsedAt,
    revokedAt: key.revokedAt,
    createdAt: key.createdAt
  };
}

export function generateApiKey(mode: "test" | "live" = "test"): string {
  return `ibs_${mode}_${randomBytes(24).toString("base64url")}`;
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 18);
}

export function hashApiKey(apiKey: string, secret: string): string {
  return createHmac("sha256", secret).update(apiKey).digest("hex");
}

export function hashesMatch(expected: string, provided: string): boolean {
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(provided, "hex");
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function createApiKey(
  connectionString: string,
  input: { userId: string; name: string; keyHash: string; keyPrefix: string }
): Promise<ApiKeyRecord> {
  const rows = await query<ApiKeyRow>(
    connectionString,
    `
    insert into api_keys (user_id, name, key_prefix, key_hash)
    values ($1, $2, $3, $4)
    returning id, user_id, name, key_prefix, key_hash, status, last_used_at::text, revoked_at::text, created_at::text
    `,
    [input.userId, input.name.trim(), input.keyPrefix, input.keyHash]
  );

  return mapApiKey(rows[0]);
}

export async function listApiKeys(connectionString: string, userId: string): Promise<PublicApiKeyRecord[]> {
  const rows = await query<ApiKeyRow>(
    connectionString,
    `
    select id, user_id, name, key_prefix, key_hash, status, last_used_at::text, revoked_at::text, created_at::text
    from api_keys
    where user_id = $1
    order by created_at desc
    `,
    [userId]
  );

  return rows.map(mapApiKey).map(toPublicApiKey);
}

export async function findActiveApiKeysByPrefix(
  connectionString: string,
  keyPrefix: string
): Promise<ApiKeyRecord[]> {
  const rows = await query<ApiKeyRow>(
    connectionString,
    `
    select id, user_id, name, key_prefix, key_hash, status, last_used_at::text, revoked_at::text, created_at::text
    from api_keys
    where key_prefix = $1 and status = 'active' and revoked_at is null
    order by created_at desc
    limit 10
    `,
    [keyPrefix]
  );

  return rows.map(mapApiKey);
}

export async function touchApiKey(connectionString: string, apiKeyId: string): Promise<void> {
  await query(connectionString, "update api_keys set last_used_at = now() where id = $1", [apiKeyId]);
}

export async function revokeApiKey(
  connectionString: string,
  input: { userId: string; apiKeyId: string }
): Promise<PublicApiKeyRecord | null> {
  const rows = await query<ApiKeyRow>(
    connectionString,
    `
    update api_keys
    set status = 'revoked', revoked_at = coalesce(revoked_at, now())
    where id = $1 and user_id = $2
    returning id, user_id, name, key_prefix, key_hash, status, last_used_at::text, revoked_at::text, created_at::text
    `,
    [input.apiKeyId, input.userId]
  );

  return rows[0] ? toPublicApiKey(mapApiKey(rows[0])) : null;
}
