const IRON_BURROW_BASE = "https://api.ironburrow.com";

export interface IronBurrowAsset {
  asset_id: string;
  symbol: string;
  name: string;
  category: string;
  canonical_path: string;
}

export interface IronBurrowChainMap {
  network: { slug: string; name: string; caip2: string };
  is_native: boolean;
  address: string | null;
}

export interface IronBurrowPrice {
  status: string; // "available" | "stale" | "unavailable"
  price: string;
  quote_currency: string;
  source_type: string;
  confidence_label: string;
  is_fallback: boolean;
  is_derived: boolean;
  recorded_at: string;
  warning: string | null;
}

export interface IronBurrowPricePoint {
  bucketStart: string;
  price: string;
  sourceType: string;
  isDerived: boolean;
  derivationPath?: string[];
  status: string;
  sourcePublishedAt: string;
}

export interface IronBurrowPriceSeries {
  quoteCurrency: string;
  window: string;
  granularity: string;
  from: string;
  to: string;
  points: IronBurrowPricePoint[];
}

export interface IronBurrowAssetDetail {
  asset: IronBurrowAsset;
  chain_maps: IronBurrowChainMap[];
  price: IronBurrowPrice | null;
  price_series: IronBurrowPriceSeries | null;
}

export type Currency = "USD" | "MXN";

export interface IronBurrowResolveHit {
  canonical_path: string;
  asset: IronBurrowAsset;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${IRON_BURROW_BASE}${path}`, {
      headers: { accept: "application/json" }
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[iron-burrow] ${path} failed:`, err);
    return null;
  }
}

export async function listIronBurrowAssets(): Promise<IronBurrowAsset[]> {
  const body = await fetchJson<{ ok: boolean; assets: IronBurrowAsset[] }>("/v1/assets");
  return body?.assets ?? [];
}

export async function getIronBurrowAsset(
  slug: string,
  options: { currency?: Currency } = {}
): Promise<IronBurrowAssetDetail | null> {
  const currency = options.currency ?? "USD";
  // Always ask for priceSeries — its latest point is the only place upstream
  // currently emits non-USD prices (priceStats / priceTrend are still down).
  const params = new URLSearchParams({
    include: "priceSeries",
    quoteCurrency: currency,
    window: "24h",
    granularity: "1h"
  });
  const body = await fetchJson<{
    ok: boolean;
    asset: IronBurrowAsset;
    chain_maps: IronBurrowChainMap[];
    price?: IronBurrowPrice | null;
    signals?: { price_series?: IronBurrowPriceSeries | null };
  }>(`/v1/assets/${encodeURIComponent(slug)}?${params.toString()}`);
  if (!body?.ok || !body.asset) return null;
  return {
    asset: body.asset,
    chain_maps: body.chain_maps ?? [],
    price: body.price ?? null,
    price_series: body.signals?.price_series ?? null
  };
}

export async function resolveIronBurrow(query: string): Promise<IronBurrowResolveHit | null> {
  const body = await fetchJson<{
    ok: boolean;
    resolved: boolean;
    result?: { kind: string; canonical_path: string; asset: IronBurrowAsset };
  }>(`/v1/resolve?q=${encodeURIComponent(query)}`);
  if (!body?.resolved || !body.result?.asset) return null;
  return { canonical_path: body.result.canonical_path, asset: body.result.asset };
}

export function findMantleChainMap(maps: IronBurrowChainMap[]): IronBurrowChainMap | null {
  return maps.find((m) => m.network.slug === "mantle") ?? null;
}
