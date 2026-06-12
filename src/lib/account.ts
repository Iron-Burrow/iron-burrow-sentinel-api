import "server-only";

import { getSql } from "./db";
import { getApiKeyPrefix, hashApiKey, hashesMatch } from "./keys";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

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

export type PublicApiKeyRecord = Omit<ApiKeyRecord, "keyHash">;

export interface UsageSummary {
  totalRequests: number;
  totalCostUnits: number;
  recent: Array<{
    requestId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    costUnits: number;
    createdAt: string;
  }>;
}

type UserRow = { id: string; email: string; name: string; created_at: string; updated_at: string };
type ApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  status: "active" | "revoked";
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    createdAt: row.created_at,
  };
}

export function toPublicApiKey(key: ApiKeyRecord): PublicApiKeyRecord {
  const { keyHash: _keyHash, ...rest } = key;
  void _keyHash;
  return rest;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createOrGetUser(input: { email: string; name: string }): Promise<UserRecord> {
  const sql = getSql();
  const rows = (await sql`
    insert into users (email, name)
    values (${normalizeEmail(input.email)}, ${input.name.trim()})
    on conflict (email) do update set name = excluded.name, updated_at = now()
    returning id, email, name, created_at::text, updated_at::text
  `) as UserRow[];
  return mapUser(rows[0]);
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    select id, email, name, created_at::text, updated_at::text from users where id = ${id}
  `) as UserRow[];
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function createApiKey(input: {
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
}): Promise<ApiKeyRecord> {
  const sql = getSql();
  const rows = (await sql`
    insert into api_keys (user_id, name, key_prefix, key_hash)
    values (${input.userId}, ${input.name.trim()}, ${input.keyPrefix}, ${input.keyHash})
    returning id, user_id, name, key_prefix, key_hash, status,
              last_used_at::text, revoked_at::text, created_at::text
  `) as ApiKeyRow[];
  return mapApiKey(rows[0]);
}

export async function listApiKeys(userId: string): Promise<PublicApiKeyRecord[]> {
  const sql = getSql();
  const rows = (await sql`
    select id, user_id, name, key_prefix, key_hash, status,
           last_used_at::text, revoked_at::text, created_at::text
    from api_keys where user_id = ${userId} order by created_at desc
  `) as ApiKeyRow[];
  return rows.map(mapApiKey).map(toPublicApiKey);
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const sql = getSql();
  const [summaryResult, recentResult] = await Promise.all([
    sql`
      select count(*)::text as total_requests,
             coalesce(sum(cost_units), 0)::text as total_cost_units
      from usage_logs where user_id = ${userId}
    `,
    sql`
      select request_id, endpoint, method, status_code, latency_ms, cost_units, created_at::text
      from usage_logs where user_id = ${userId} order by created_at desc limit 25
    `,
  ]);

  const summaryRows = summaryResult as Array<{ total_requests: string; total_cost_units: string }>;
  const recentRows = recentResult as Array<{
    request_id: string;
    endpoint: string;
    method: string;
    status_code: number;
    latency_ms: number;
    cost_units: number;
    created_at: string;
  }>;

  const summary = summaryRows[0];
  return {
    totalRequests: Number(summary?.total_requests ?? 0),
    totalCostUnits: Number(summary?.total_cost_units ?? 0),
    recent: recentRows.map((row) => ({
      requestId: row.request_id,
      endpoint: row.endpoint,
      method: row.method,
      statusCode: row.status_code,
      latencyMs: row.latency_ms,
      costUnits: row.cost_units,
      createdAt: row.created_at,
    })),
  };
}

function readApiKeyHeader(headers: Headers): string | null {
  const authorization = headers.get("authorization")?.trim();
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }
  return headers.get("x-api-key")?.trim() || null;
}

export async function authenticateRequest(
  headers: Headers,
): Promise<{ user: UserRecord; apiKey: ApiKeyRecord } | null> {
  const rawApiKey = readApiKeyHeader(headers);
  if (!rawApiKey) return null;

  const sql = getSql();
  const keyHash = hashApiKey(rawApiKey);
  const candidates = (await sql`
    select id, user_id, name, key_prefix, key_hash, status,
           last_used_at::text, revoked_at::text, created_at::text
    from api_keys
    where key_prefix = ${getApiKeyPrefix(rawApiKey)} and status = 'active' and revoked_at is null
    order by created_at desc limit 10
  `) as ApiKeyRow[];

  const apiKey = candidates
    .map(mapApiKey)
    .find((candidate) => hashesMatch(candidate.keyHash, keyHash));
  if (!apiKey) return null;

  const user = await getUserById(apiKey.userId);
  if (!user) return null;

  await sql`update api_keys set last_used_at = now() where id = ${apiKey.id}`;
  return { user, apiKey };
}
