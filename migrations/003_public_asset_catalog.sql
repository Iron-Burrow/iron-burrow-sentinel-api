create extension if not exists pgcrypto;

create table if not exists public_assets (
  slug text primary key,
  symbol text not null,
  name text not null,
  description text not null,
  tags text[] not null default array[]::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public_asset_representations (
  id uuid primary key default gen_random_uuid(),
  asset_slug text not null references public_assets(slug) on delete cascade,
  chain text not null,
  address text not null,
  symbol text not null,
  name text not null,
  indexed_status text not null default 'partial',
  canonical_path text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_public_assets_lower_slug on public_assets (lower(slug));
create index if not exists idx_public_assets_upper_symbol on public_assets (upper(symbol));
create index if not exists idx_public_assets_lower_name on public_assets (lower(name));
create index if not exists idx_public_asset_representations_lower_address on public_asset_representations (lower(address));
create unique index if not exists idx_public_asset_representations_chain_lower_address
  on public_asset_representations (chain, lower(address));

insert into public_assets (slug, symbol, name, description, tags, is_active)
values
  (
    'mburrow',
    'mBURROW',
    'Mock Burrow Signal Token',
    'Sentinel public hackathon demo asset for source-aware Mantle holder, concentration, and liquidity intelligence. Coverage is curated and intentionally partial.',
    array['Public Mantle intelligence', 'Source-aware responses', 'Honest partial coverage'],
    true
  ),
  (
    'mdemo',
    'mDEMO',
    'Mock Demo Liquidity Token',
    'Sentinel public hackathon demo asset used to show search results and liquidity signals without exposing private infrastructure.',
    array['Hackathon-facing public API', 'Demo liquidity signal'],
    true
  ),
  (
    'wbtc',
    'WBTC',
    'Wrapped Bitcoin',
    'Curated Sentinel public hackathon demo coverage for a Wrapped Bitcoin representation on Mantle. This is partial demo metadata, not full chain coverage.',
    array['Curated public demo coverage', 'Mantle representation', 'Partial coverage'],
    true
  ),
  (
    'meth',
    'mETH',
    'Mantle Staked Ether',
    'Curated Sentinel public hackathon demo coverage for Mantle Staked Ether. This is partial demo metadata, not full chain coverage.',
    array['Curated public demo coverage', 'Mantle staking', 'Partial coverage'],
    true
  ),
  (
    'usdy',
    'USDY',
    'Ondo US Dollar Yield',
    'Curated Sentinel public hackathon demo coverage for Ondo US Dollar Yield on Mantle. This is partial demo metadata, not full chain coverage.',
    array['Curated public demo coverage', 'Yield asset', 'Partial coverage'],
    true
  ),
  (
    'mnt',
    'MNT',
    'Mantle',
    'Curated Sentinel public hackathon demo coverage for Mantle. This is partial demo metadata, not full chain coverage.',
    array['Curated public demo coverage', 'Mantle ecosystem', 'Partial coverage'],
    true
  )
on conflict (slug) do update
set
  symbol = excluded.symbol,
  name = excluded.name,
  description = excluded.description,
  tags = excluded.tags,
  is_active = excluded.is_active,
  updated_at = now();

insert into public_asset_representations (
  asset_slug,
  chain,
  address,
  symbol,
  name,
  indexed_status,
  canonical_path,
  is_active
)
values
  (
    'mburrow',
    'mantle',
    '0x1111111111111111111111111111111111111111',
    'mBURROW',
    'Mock Burrow Signal Token',
    'partial',
    '/mantle/asset/0x1111111111111111111111111111111111111111',
    true
  ),
  (
    'mdemo',
    'mantle',
    '0x2222222222222222222222222222222222222222',
    'mDEMO',
    'Mock Demo Liquidity Token',
    'demo',
    '/mantle/asset/0x2222222222222222222222222222222222222222',
    true
  ),
  (
    'wbtc',
    'mantle',
    '0x3333333333333333333333333333333333333333',
    'WBTC',
    'Wrapped Bitcoin',
    'partial',
    '/mantle/asset/0x3333333333333333333333333333333333333333',
    true
  ),
  (
    'meth',
    'mantle',
    '0x4444444444444444444444444444444444444444',
    'mETH',
    'Mantle Staked Ether',
    'partial',
    '/mantle/asset/0x4444444444444444444444444444444444444444',
    true
  ),
  (
    'usdy',
    'mantle',
    '0x5555555555555555555555555555555555555555',
    'USDY',
    'Ondo US Dollar Yield',
    'partial',
    '/mantle/asset/0x5555555555555555555555555555555555555555',
    true
  ),
  (
    'mnt',
    'mantle',
    '0x6666666666666666666666666666666666666666',
    'MNT',
    'Mantle',
    'partial',
    '/mantle/asset/0x6666666666666666666666666666666666666666',
    true
  )
on conflict (chain, (lower(address))) do update
set
  asset_slug = excluded.asset_slug,
  symbol = excluded.symbol,
  name = excluded.name,
  indexed_status = excluded.indexed_status,
  canonical_path = excluded.canonical_path,
  is_active = excluded.is_active,
  updated_at = now();
