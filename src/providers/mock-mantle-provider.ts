import type {
  LiquidityDeltaResponse,
  MantleAssetSummary,
  MantleConcentrationResponse,
  MantleHolder,
  MantleHoldersResponse,
  MantleProvider,
  QueryResponse,
  SentinelMetadata
} from "./mantle-provider.js";

const metadata: SentinelMetadata = {
  source: "sentinel-demo-provider",
  freshness: "demo snapshot refreshed for hackathon walkthroughs",
  indexed_until_block: 70_234_121,
  confidence: "medium",
  is_partial: true,
  warnings: [
    "Demo data is partial and should not be treated as complete Mantle coverage.",
    "Private indexers and nodes are intentionally not exposed by this public repository."
  ]
};

const holders: MantleHolder[] = [
  {
    rank: 1,
    address: "0x8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a",
    balance: "1842000.000000",
    balance_usd: "1031520.00",
    percent_supply: "18.42",
    label: "demo treasury"
  },
  {
    rank: 2,
    address: "0x4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b",
    balance: "991000.000000",
    balance_usd: "554960.00",
    percent_supply: "9.91",
    label: "demo liquidity pool"
  },
  {
    rank: 3,
    address: "0x2727272727272727272727272727272727272727",
    balance: "612500.000000",
    balance_usd: "343000.00",
    percent_supply: "6.13",
    label: null
  },
  {
    rank: 4,
    address: "0x5151515151515151515151515151515151515151",
    balance: "384200.000000",
    balance_usd: "215152.00",
    percent_supply: "3.84",
    label: null
  }
];

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export class MockMantleProvider implements MantleProvider {
  async getSources(): Promise<Array<{ id: string; label: string; metadata: SentinelMetadata }>> {
    return [
      {
        id: "sentinel-demo-provider",
        label: "Sentinel demo provider",
        metadata
      }
    ];
  }

  async getAssetSummary(address: string): Promise<MantleAssetSummary> {
    return {
      chain: "mantle",
      address: normalizeAddress(address),
      symbol: "mBURROW",
      name: "Mock Burrow Signal Token",
      decimals: 18,
      price_usd: "0.56",
      liquidity_usd: "4285000.00",
      holder_count: 1284,
      top_holder_percent: "18.42",
      metadata
    };
  }

  async getAssetHolders(address: string, options: { limit: number }): Promise<MantleHoldersResponse> {
    return {
      chain: "mantle",
      asset_address: normalizeAddress(address),
      holders: holders.slice(0, options.limit),
      page: {
        limit: options.limit,
        next_cursor: null
      },
      metadata
    };
  }

  async getAssetConcentration(address: string): Promise<MantleConcentrationResponse> {
    return {
      chain: "mantle",
      asset_address: normalizeAddress(address),
      metrics: {
        top_1_percent: "18.42",
        top_5_percent: "41.73",
        top_10_percent: "56.88",
        gini_estimate: "0.72",
        holder_count: 1284
      },
      metadata
    };
  }

  async getLiquidityDelta(): Promise<LiquidityDeltaResponse> {
    return {
      chain: "mantle",
      signals: [
        {
          asset_address: "0x1111111111111111111111111111111111111111",
          symbol: "mBURROW",
          window: "24h",
          liquidity_delta_usd: "284000.00",
          liquidity_delta_percent: "7.09",
          signal: "inflow",
          confidence: "medium"
        },
        {
          asset_address: "0x2222222222222222222222222222222222222222",
          symbol: "mDEMO",
          window: "24h",
          liquidity_delta_usd: "-42000.00",
          liquidity_delta_percent: "-2.14",
          signal: "outflow",
          confidence: "low"
        }
      ],
      metadata
    };
  }

  async query(input: { query: string }): Promise<QueryResponse> {
    return {
      query: input.query,
      answer:
        "Sentinel demo data shows partial Mantle liquidity inflow for mBURROW and concentrated top-holder ownership. Treat this as a source-aware demo response, not complete chain coverage.",
      routes_used: [
        "/v1/mantle/signals/liquidity-delta",
        "/v1/mantle/assets/:address/concentration"
      ],
      metadata
    };
  }
}
