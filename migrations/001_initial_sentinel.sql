create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
);

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
);

create table if not exists rate_limit_buckets (
  id bigserial primary key,
  api_key_id uuid not null references api_keys(id) on delete cascade,
  window_start timestamptz not null,
  window_seconds integer not null,
  request_count integer not null default 0,
  cost_units integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (api_key_id, window_start, window_seconds)
);

create table if not exists demo_sources (
  id text primary key,
  label text not null,
  freshness text not null,
  indexed_until_block bigint not null,
  confidence text not null,
  is_partial boolean not null default true,
  warnings text[] not null default array[]::text[],
  updated_at timestamptz not null default now()
);

create index if not exists idx_api_keys_user_id on api_keys(user_id);
create index if not exists idx_api_keys_key_prefix on api_keys(key_prefix);
create index if not exists idx_usage_logs_api_key_created on usage_logs(api_key_id, created_at desc);
create index if not exists idx_usage_logs_user_created on usage_logs(user_id, created_at desc);
create index if not exists idx_rate_limit_buckets_key_window on rate_limit_buckets(api_key_id, window_start desc);
