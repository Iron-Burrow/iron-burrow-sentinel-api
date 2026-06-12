// Shared domain types for the Iron Burrow Sentinel front-end.
//
// These are pure type declarations (no runtime code), so they can be imported
// freely from both Server and Client Components without pulling server-only
// modules into the client bundle.

export type Currency = "USD" | "MXN";

// ---------------------------------------------------------------------------
// Iron Burrow upstream API (api.ironburrow.com)
// ---------------------------------------------------------------------------

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

export interface IronBurrowResolveHit {
  canonical_path: string;
  asset: IronBurrowAsset;
}

// ---------------------------------------------------------------------------
// Sentinel Mantle provider (demo data)
// ---------------------------------------------------------------------------

export interface SentinelMetadata {
  source: string;
  freshness: string;
  indexed_until_block: number;
  confidence: "low" | "medium" | "high";
  is_partial: boolean;
  warnings: string[];
}

export interface MantleAssetSummary {
  chain: "mantle";
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price_usd: string | null;
  price_7d_high: string | null;
  price_7d_low: string | null;
  liquidity_usd: string;
  holder_count: number;
  top_holder_percent: string;
  metadata: SentinelMetadata;
}

export interface MantleHolder {
  rank: number;
  address: string;
  balance: string;
  balance_usd: string | null;
  percent_supply: string;
  label: string | null;
  change_percent_7d: string | null;
}

export interface MantleHoldersResponse {
  chain: "mantle";
  asset_address: string;
  holders: MantleHolder[];
  page: { limit: number; next_cursor: string | null };
  metadata: SentinelMetadata;
}

export interface MantleConcentrationResponse {
  chain: "mantle";
  asset_address: string;
  metrics: {
    top_1_percent: string;
    top_5_percent: string;
    top_10_percent: string;
    gini_estimate: string;
    holder_count: number;
  };
  metadata: SentinelMetadata;
}

export interface LiquidityDeltaSignal {
  asset_address: string;
  symbol: string;
  window: string;
  liquidity_delta_usd: string;
  liquidity_delta_percent: string;
  signal: "inflow" | "outflow" | "flat";
  confidence: "low" | "medium" | "high";
}

export interface LiquidityDeltaResponse {
  chain: "mantle";
  signals: LiquidityDeltaSignal[];
  metadata: SentinelMetadata;
}

// ---------------------------------------------------------------------------
// Public catalog (canonical assets + Mantle representations)
// ---------------------------------------------------------------------------

export type PublicAssetChain = "mantle";
export type PublicAssetIndexedStatus = "partial" | "demo";
export type PublicAssetKind = "canonical" | "native" | "commodity";

export interface PublicAssetRepresentation {
  chain: PublicAssetChain;
  address: string;
  canonicalPath: string;
  indexedStatus: PublicAssetIndexedStatus;
  logoUrl: string | null;
  name: string;
  symbol: string;
}

export interface PublicCanonicalAsset {
  slug: string;
  symbol: string;
  name: string;
  description: string;
  assetKind: PublicAssetKind;
  aliases: string[];
  logoUrl: string | null;
  relatedAssetSlugs: string[];
  tags: string[];
  representations: PublicAssetRepresentation[];
}

export type PublicMatchKind =
  | "address"
  | "exact_symbol"
  | "exact_slug"
  | "exact_name"
  | "exact_alias"
  | "partial_symbol"
  | "partial_slug"
  | "partial_name";

export interface PublicSimilarAsset {
  slug: string;
  symbol: string;
  name: string;
  matchKind: PublicMatchKind | "related_asset";
  canonicalPath: string;
  logoUrl: string | null;
}

export interface PublicSearchMatch {
  kind: "canonical_asset" | "mantle_asset";
  scope: "canonical" | "chain";
  canonicalPath: string;
  title: string;
  slug: string | null;
  symbol: string | null;
  name: string | null;
  address: string | null;
  logoUrl: string | null;
  matchKind: PublicMatchKind;
}

export interface PublicResolveResult {
  ok: true;
  query: string;
  normalizedQuery: string;
  kind: "empty" | "unknown" | "redirect" | "search_results";
  canonicalPath: string | null;
  matches: PublicSearchMatch[];
  message: string | null;
}

export interface PublicMantleAssetPayload {
  chain: "mantle";
  address: string;
  summary: MantleAssetSummary;
  holders: MantleHoldersResponse;
  concentration: MantleConcentrationResponse;
  catalogAsset: PublicCanonicalAsset | null;
  logoUrl: string | null;
  liquiditySignal: LiquidityDeltaSignal | null;
  publicBoundary: {
    exposesPrivateRpc: false;
    exposesPrivateIndexers: false;
    exposesInternalGateway: false;
  };
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}
