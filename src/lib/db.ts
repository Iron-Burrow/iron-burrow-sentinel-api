import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Serverless-friendly Postgres access (works on Vercel without TCP connection
// pool exhaustion). Set DATABASE_URL to a Vercel Postgres / Neon connection
// string. The same string works for local development.

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — account features need a Postgres database.");
  }
  if (!cachedSql) {
    cachedSql = neon(connectionString);
  }
  return cachedSql;
}

let schemaReady: Promise<void> | null = null;

// Lazily create the account tables (idempotent) on first use, so a fresh
// Postgres just works without a separate migration step. gen_random_uuid() is
// built into Postgres 13+ (Neon/Vercel Postgres), so no extension is required.
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        create table if not exists users (
          id uuid primary key default gen_random_uuid(),
          email text not null unique,
          name text not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )`;
      await sql`
        create table if not exists api_keys (
          id uuid primary key default gen_random_uuid(),
          user_id uuid not null references users(id) on delete cascade,
          name text not null,
          key_prefix text not null,
          key_hash text not null unique,
          status text not null default 'active',
          last_used_at timestamptz,
          revoked_at timestamptz,
          created_at timestamptz not null default now()
        )`;
      await sql`
        create table if not exists usage_logs (
          id bigserial primary key,
          request_id text not null,
          user_id uuid references users(id) on delete set null,
          api_key_id uuid references api_keys(id) on delete set null,
          endpoint text not null,
          method text not null,
          status_code integer not null,
          latency_ms integer not null,
          cost_units integer not null default 1,
          created_at timestamptz not null default now()
        )`;
      await sql`create index if not exists idx_api_keys_user_id on api_keys(user_id)`;
      await sql`create index if not exists idx_api_keys_key_prefix on api_keys(key_prefix)`;
      await sql`create index if not exists idx_usage_logs_user_created on usage_logs(user_id, created_at desc)`;
    })().catch((err) => {
      // Allow a retry on the next request if schema creation failed.
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
