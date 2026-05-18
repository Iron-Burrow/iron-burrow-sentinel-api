alter table public_assets
  add column if not exists asset_kind text not null default 'canonical';

alter table public_assets
  add column if not exists aliases text[] not null default array[]::text[];

alter table public_assets
  add column if not exists related_asset_slugs text[] not null default array[]::text[];

alter table public_assets
  drop constraint if exists chk_public_assets_asset_kind;

alter table public_assets
  add constraint chk_public_assets_asset_kind
  check (asset_kind in ('canonical', 'native', 'commodity'));

create index if not exists idx_public_assets_aliases_gin
  on public_assets using gin (aliases);

insert into public_assets (
  slug,
  symbol,
  name,
  description,
  asset_kind,
  aliases,
  related_asset_slugs,
  tags,
  is_active
)
values
  (
    'btc',
    'BTC',
    'Bitcoin',
    'Bitcoin as a Sentinel public canonical asset family. Known tokenized representations may exist before Sentinel has any native BTC balance, holder, price, or liquidity data to expose.',
    'native',
    array['bitcoin'],
    array['wbtc', 'cbbtc', 'tbtc'],
    array['Canonical native asset', 'Addressless asset family', 'Honest partial coverage'],
    true
  ),
  (
    'eth',
    'ETH',
    'Ether',
    'Ether as a Sentinel public canonical asset family. Chain-specific wrapped or staked representations remain separate catalog entries when Sentinel knows them.',
    'native',
    array['ethereum'],
    array['meth', 'weth', 'wsteth', 'reth', 'steth'],
    array['Canonical native asset', 'Addressless asset family', 'Honest partial coverage'],
    true
  ),
  (
    'gold',
    'GOLD',
    'Gold',
    'Gold as a Sentinel public canonical asset family. Tokenized gold representations are shown only when they exist in the public Sentinel catalog.',
    'commodity',
    array['xau'],
    array['xaut', 'paxg'],
    array['Canonical commodity asset', 'Addressless asset family', 'Honest partial coverage'],
    true
  )
on conflict (slug) do update
set
  symbol = excluded.symbol,
  name = excluded.name,
  description = excluded.description,
  asset_kind = excluded.asset_kind,
  aliases = excluded.aliases,
  related_asset_slugs = excluded.related_asset_slugs,
  tags = excluded.tags,
  is_active = excluded.is_active,
  updated_at = now();

update public_assets
set
  asset_kind = 'canonical',
  related_asset_slugs = case slug
    when 'wbtc' then array['btc']
    when 'meth' then array['eth']
    else related_asset_slugs
  end,
  updated_at = now()
where slug not in ('btc', 'eth', 'gold');
