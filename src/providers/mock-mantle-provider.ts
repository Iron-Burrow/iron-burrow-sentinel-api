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

const holdersMap = new Map<string, MantleHolder[]>([
  [
    "0x1111111111111111111111111111111111111111",
    [
      { rank: 1, address: "0x8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a8a", balance: "1842000.000000", balance_usd: "1031520.00", percent_supply: "18.42", label: "demo treasury", change_percent_7d: "+2.1" },
      { rank: 2, address: "0x4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b4b", balance: "991000.000000", balance_usd: "554960.00", percent_supply: "9.91", label: "demo liquidity pool", change_percent_7d: "-0.4" },
      { rank: 3, address: "0x2727272727272727272727272727272727272727", balance: "612500.000000", balance_usd: "343000.00", percent_supply: "6.13", label: null, change_percent_7d: "+0.8" },
      { rank: 4, address: "0x5151515151515151515151515151515151515151", balance: "384200.000000", balance_usd: "215152.00", percent_supply: "3.84", label: null, change_percent_7d: null }
    ]
  ],
  [
    "0x4444444444444444444444444444444444444444",
    [
      { rank: 1, address: "0xaabb001122334455667788aabb001122334455aa", balance: "4200.000000", balance_usd: "13356000.00", percent_supply: "22.10", label: "mETH Protocol Reserve", change_percent_7d: "+4.3" },
      { rank: 2, address: "0xcc11223344556677889900aabbccddeeff001122", balance: "1850.000000", balance_usd: "5883000.00", percent_supply: "9.74", label: "Bybit Hot Wallet", change_percent_7d: "+12.8" },
      { rank: 3, address: "0xdd2233445566778899aabbcc00112233dd445566", balance: "980.000000", balance_usd: "3116400.00", percent_supply: "5.15", label: null, change_percent_7d: "+6.2" },
      { rank: 4, address: "0xee33445566778899aabbccddee001122ff334455", balance: "620.000000", balance_usd: "1971600.00", percent_supply: "3.26", label: "Mantle Treasury", change_percent_7d: "-1.1" },
      { rank: 5, address: "0xff445566778899aabbccddeeff00112233445566", balance: "410.000000", balance_usd: "1303800.00", percent_supply: "2.16", label: null, change_percent_7d: "+8.9" }
    ]
  ],
  [
    "0x5555555555555555555555555555555555555555",
    [
      { rank: 1, address: "0xaa1122334455667788990011aabb223344556677", balance: "12400000.000000", balance_usd: "12896000.00", percent_supply: "31.20", label: "Ondo Finance Vault", change_percent_7d: "+0.2" },
      { rank: 2, address: "0xbb2233445566778899001122bbcc334455667788", balance: "4800000.000000", balance_usd: "4992000.00", percent_supply: "12.07", label: "Stargate Pool", change_percent_7d: "+1.5" },
      { rank: 3, address: "0xcc3344556677889900112233ccdd445566778899", balance: "2100000.000000", balance_usd: "2184000.00", percent_supply: "5.28", label: null, change_percent_7d: "+3.1" },
      { rank: 4, address: "0xdd4455667788990011223344ddee556677889900", balance: "890000.000000", balance_usd: "925600.00", percent_supply: "2.24", label: null, change_percent_7d: "-0.3" }
    ]
  ],
  [
    "0x6666666666666666666666666666666666666666",
    [
      { rank: 1, address: "0xee5566778899001122334455eeff667788990011", balance: "248000000.000000", balance_usd: "203360000.00", percent_supply: "24.80", label: "Mantle Treasury", change_percent_7d: "+0.0" },
      { rank: 2, address: "0xff6677889900112233445566ff00778899001122", balance: "89000000.000000", balance_usd: "72980000.00", percent_supply: "8.90", label: "Binance Hot Wallet", change_percent_7d: "+5.4" },
      { rank: 3, address: "0xaa7788990011223344556677aa11889900112233", balance: "42000000.000000", balance_usd: "34440000.00", percent_supply: "4.20", label: "OKX Deposit", change_percent_7d: "+2.8" },
      { rank: 4, address: "0xbb8899001122334455667788bb22990011223344", balance: "31000000.000000", balance_usd: "25420000.00", percent_supply: "3.10", label: null, change_percent_7d: "+9.7" },
      { rank: 5, address: "0xcc9900112233445566778899cc33001122334455", balance: "18500000.000000", balance_usd: "15170000.00", percent_supply: "1.85", label: null, change_percent_7d: "-2.1" }
    ]
  ]
]);

const assetSummaries = new Map<string, Pick<MantleAssetSummary, "symbol" | "name" | "price_usd" | "price_7d_high" | "price_7d_low" | "liquidity_usd" | "holder_count" | "top_holder_percent">>([
  [
    "0x1111111111111111111111111111111111111111",
    { symbol: "mBURROW", name: "Mock Burrow Signal Token", price_usd: "0.56", price_7d_high: "0.62", price_7d_low: "0.48", liquidity_usd: "4285000.00", holder_count: 1284, top_holder_percent: "18.42" }
  ],
  [
    "0x2222222222222222222222222222222222222222",
    { symbol: "mDEMO", name: "Mock Demo Liquidity Token", price_usd: "0.14", price_7d_high: "0.16", price_7d_low: "0.12", liquidity_usd: "1918000.00", holder_count: 892, top_holder_percent: "14.20" }
  ],
  [
    "0x3333333333333333333333333333333333333333",
    { symbol: "WBTC", name: "Wrapped Bitcoin", price_usd: "64250.00", price_7d_high: "67800.00", price_7d_low: "61200.00", liquidity_usd: "9825000.00", holder_count: 3412, top_holder_percent: "15.80" }
  ],
  [
    "0x4444444444444444444444444444444444444444",
    { symbol: "mETH", name: "Mantle Staked Ether", price_usd: "3180.00", price_7d_high: "3340.00", price_7d_low: "2980.00", liquidity_usd: "7440000.00", holder_count: 5821, top_holder_percent: "22.10" }
  ],
  [
    "0x5555555555555555555555555555555555555555",
    { symbol: "USDY", name: "Ondo US Dollar Yield", price_usd: "1.04", price_7d_high: "1.05", price_7d_low: "1.02", liquidity_usd: "5360000.00", holder_count: 2147, top_holder_percent: "31.20" }
  ],
  [
    "0x6666666666666666666666666666666666666666",
    { symbol: "MNT", name: "Mantle", price_usd: "0.82", price_7d_high: "0.91", price_7d_low: "0.74", liquidity_usd: "12840000.00", holder_count: 14829, top_holder_percent: "24.80" }
  ]
]);

const concentrationMap = new Map<string, { top_1_percent: string; top_5_percent: string; top_10_percent: string; gini_estimate: string; holder_count: number }>([
  ["0x1111111111111111111111111111111111111111", { top_1_percent: "18.42", top_5_percent: "41.73", top_10_percent: "56.88", gini_estimate: "0.72", holder_count: 1284 }],
  ["0x4444444444444444444444444444444444444444", { top_1_percent: "22.10", top_5_percent: "44.25", top_10_percent: "58.90", gini_estimate: "0.76", holder_count: 5821 }],
  ["0x5555555555555555555555555555555555555555", { top_1_percent: "31.20", top_5_percent: "52.75", top_10_percent: "64.30", gini_estimate: "0.81", holder_count: 2147 }],
  ["0x6666666666666666666666666666666666666666", { top_1_percent: "24.80", top_5_percent: "41.90", top_10_percent: "54.15", gini_estimate: "0.74", holder_count: 14829 }]
]);

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
    const normalizedAddress = normalizeAddress(address);
    const asset = assetSummaries.get(normalizedAddress) ?? {
      symbol: "MANTLE",
      name: "Mantle asset",
      price_usd: "0.00",
      price_7d_high: null,
      price_7d_low: null,
      liquidity_usd: "125000.00",
      holder_count: 1284,
      top_holder_percent: "18.42"
    };

    return {
      chain: "mantle",
      address: normalizedAddress,
      symbol: asset.symbol,
      name: asset.name,
      decimals: 18,
      price_usd: asset.price_usd,
      price_7d_high: asset.price_7d_high ?? null,
      price_7d_low: asset.price_7d_low ?? null,
      liquidity_usd: asset.liquidity_usd,
      holder_count: asset.holder_count,
      top_holder_percent: asset.top_holder_percent,
      metadata
    };
  }

  async getAssetHolders(address: string, options: { limit: number }): Promise<MantleHoldersResponse> {
    const normalizedAddress = normalizeAddress(address);
    const assetHolders = holdersMap.get(normalizedAddress) ?? holdersMap.get("0x1111111111111111111111111111111111111111")!;

    return {
      chain: "mantle",
      asset_address: normalizedAddress,
      holders: assetHolders.slice(0, options.limit),
      page: {
        limit: options.limit,
        next_cursor: null
      },
      metadata
    };
  }

  async getAssetConcentration(address: string): Promise<MantleConcentrationResponse> {
    const normalizedAddress = normalizeAddress(address);
    const metrics = concentrationMap.get(normalizedAddress) ?? { top_1_percent: "18.42", top_5_percent: "41.73", top_10_percent: "56.88", gini_estimate: "0.72", holder_count: 1284 };

    return {
      chain: "mantle",
      asset_address: normalizedAddress,
      metrics,
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
        },
        {
          asset_address: "0x4444444444444444444444444444444444444444",
          symbol: "mETH",
          window: "24h",
          liquidity_delta_usd: "512000.00",
          liquidity_delta_percent: "6.88",
          signal: "inflow",
          confidence: "high"
        },
        {
          asset_address: "0x5555555555555555555555555555555555555555",
          symbol: "USDY",
          window: "24h",
          liquidity_delta_usd: "89000.00",
          liquidity_delta_percent: "1.66",
          signal: "inflow",
          confidence: "medium"
        },
        {
          asset_address: "0x6666666666666666666666666666666666666666",
          symbol: "MNT",
          window: "24h",
          liquidity_delta_usd: "-340000.00",
          liquidity_delta_percent: "-2.65",
          signal: "outflow",
          confidence: "high"
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
