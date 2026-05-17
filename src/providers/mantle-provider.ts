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
}

export interface MantleHoldersResponse {
  chain: "mantle";
  asset_address: string;
  holders: MantleHolder[];
  page: {
    limit: number;
    next_cursor: string | null;
  };
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

export interface QueryResponse {
  query: string;
  answer: string;
  routes_used: string[];
  metadata: SentinelMetadata;
}

export interface MantleProvider {
  getSources(): Promise<Array<{ id: string; label: string; metadata: SentinelMetadata }>>;
  getAssetSummary(address: string): Promise<MantleAssetSummary>;
  getAssetHolders(address: string, options: { limit: number }): Promise<MantleHoldersResponse>;
  getAssetConcentration(address: string): Promise<MantleConcentrationResponse>;
  getLiquidityDelta(): Promise<LiquidityDeltaResponse>;
  query(input: { query: string }): Promise<QueryResponse>;
}
