// In-memory public asset catalog + search/resolve. Self-contained replacement
// for the Hono backend's Postgres-backed catalog (migrations 003 + 004),
// reimplemented as pure data so the front-end runs without a database.

import { resolveTokenMediaUrl } from "./token-media";
import type {
  PublicCanonicalAsset,
  PublicMatchKind,
  PublicResolveResult,
  PublicSearchMatch,
  PublicSimilarAsset,
} from "./types";

// --- normalizers ------------------------------------------------------------

export function normalizePublicSearchQuery(query: string): string {
  return query.trim();
}
export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}
export function normalizeMantleAddress(address: string): string {
  return address.trim().toLowerCase();
}
export function isMantleAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/u.test(value.trim());
}

// --- seed data --------------------------------------------------------------

interface AssetSeed {
  slug: string;
  symbol: string;
  name: string;
  description: string;
  assetKind: PublicCanonicalAsset["assetKind"];
  aliases: string[];
  relatedAssetSlugs: string[];
  tags: string[];
  representation?: {
    address: string;
    indexedStatus: "partial" | "demo";
  };
}

const SEED: AssetSeed[] = [
  {
    slug: "mburrow",
    symbol: "mBURROW",
    name: "Mock Burrow Signal Token",
    description:
      "Sentinel public hackathon demo asset for source-aware Mantle holder, concentration, and liquidity intelligence. Coverage is curated and intentionally partial.",
    assetKind: "canonical",
    aliases: [],
    relatedAssetSlugs: [],
    tags: ["Public Mantle intelligence", "Source-aware responses", "Honest partial coverage"],
    representation: { address: "0x1111111111111111111111111111111111111111", indexedStatus: "partial" },
  },
  {
    slug: "mdemo",
    symbol: "mDEMO",
    name: "Mock Demo Liquidity Token",
    description:
      "Sentinel public hackathon demo asset used to show search results and liquidity signals without exposing private infrastructure.",
    assetKind: "canonical",
    aliases: [],
    relatedAssetSlugs: [],
    tags: ["Hackathon-facing public API", "Demo liquidity signal"],
    representation: { address: "0x2222222222222222222222222222222222222222", indexedStatus: "demo" },
  },
  {
    slug: "wbtc",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    description:
      "Curated Sentinel public hackathon demo coverage for a Wrapped Bitcoin representation on Mantle. This is partial demo metadata, not full chain coverage.",
    assetKind: "canonical",
    aliases: [],
    relatedAssetSlugs: ["btc"],
    tags: ["Curated public demo coverage", "Mantle representation", "Partial coverage"],
    representation: { address: "0x3333333333333333333333333333333333333333", indexedStatus: "partial" },
  },
  {
    slug: "meth",
    symbol: "mETH",
    name: "Mantle Staked Ether",
    description:
      "Curated Sentinel public hackathon demo coverage for Mantle Staked Ether. This is partial demo metadata, not full chain coverage.",
    assetKind: "canonical",
    aliases: [],
    relatedAssetSlugs: ["eth"],
    tags: ["Curated public demo coverage", "Mantle staking", "Partial coverage"],
    representation: { address: "0x4444444444444444444444444444444444444444", indexedStatus: "partial" },
  },
  {
    slug: "usdy",
    symbol: "USDY",
    name: "Ondo US Dollar Yield",
    description:
      "Curated Sentinel public hackathon demo coverage for Ondo US Dollar Yield on Mantle. This is partial demo metadata, not full chain coverage.",
    assetKind: "canonical",
    aliases: [],
    relatedAssetSlugs: [],
    tags: ["Curated public demo coverage", "Yield asset", "Partial coverage"],
    representation: { address: "0x5555555555555555555555555555555555555555", indexedStatus: "partial" },
  },
  {
    slug: "mnt",
    symbol: "MNT",
    name: "Mantle",
    description:
      "Curated Sentinel public hackathon demo coverage for Mantle. This is partial demo metadata, not full chain coverage.",
    assetKind: "canonical",
    aliases: [],
    relatedAssetSlugs: [],
    tags: ["Curated public demo coverage", "Mantle ecosystem", "Partial coverage"],
    representation: { address: "0x6666666666666666666666666666666666666666", indexedStatus: "partial" },
  },
  {
    slug: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    description:
      "Bitcoin as a Sentinel public canonical asset family. Known tokenized representations may exist before Sentinel has any native BTC balance, holder, price, or liquidity data to expose.",
    assetKind: "native",
    aliases: ["bitcoin"],
    relatedAssetSlugs: ["wbtc", "cbbtc", "tbtc"],
    tags: ["Canonical native asset", "Addressless asset family", "Honest partial coverage"],
  },
  {
    slug: "eth",
    symbol: "ETH",
    name: "Ether",
    description:
      "Ether as a Sentinel public canonical asset family. Chain-specific wrapped or staked representations remain separate catalog entries when Sentinel knows them.",
    assetKind: "native",
    aliases: ["ethereum"],
    relatedAssetSlugs: ["meth", "weth", "wsteth", "reth", "steth"],
    tags: ["Canonical native asset", "Addressless asset family", "Honest partial coverage"],
  },
  {
    slug: "gold",
    symbol: "GOLD",
    name: "Gold",
    description:
      "Gold as a Sentinel public canonical asset family. Tokenized gold representations are shown only when they exist in the public Sentinel catalog.",
    assetKind: "commodity",
    aliases: ["xau"],
    relatedAssetSlugs: ["xaut", "paxg"],
    tags: ["Canonical commodity asset", "Addressless asset family", "Honest partial coverage"],
  },
];

function buildAsset(seed: AssetSeed): PublicCanonicalAsset {
  const representations = seed.representation
    ? [
        {
          chain: "mantle" as const,
          address: normalizeMantleAddress(seed.representation.address),
          canonicalPath: `/mantle/asset/${normalizeMantleAddress(seed.representation.address)}`,
          indexedStatus: seed.representation.indexedStatus,
          logoUrl: resolveTokenMediaUrl({
            address: seed.representation.address,
            symbol: seed.symbol,
            name: seed.name,
          }),
          name: seed.name,
          symbol: seed.symbol,
        },
      ]
    : [];

  return {
    slug: seed.slug,
    symbol: seed.symbol,
    name: seed.name,
    description: seed.description,
    assetKind: seed.assetKind,
    aliases: seed.aliases,
    logoUrl: resolveTokenMediaUrl({ slug: seed.slug, symbol: seed.symbol, name: seed.name }),
    relatedAssetSlugs: seed.relatedAssetSlugs,
    tags: seed.tags,
    representations,
  };
}

const CATALOG: PublicCanonicalAsset[] = SEED.map(buildAsset).sort((a, b) =>
  a.slug.localeCompare(b.slug),
);

// --- lookups ----------------------------------------------------------------

export function listPublicAssets(): PublicCanonicalAsset[] {
  return CATALOG;
}

export function findPublicAssetBySlug(slug: string): PublicCanonicalAsset | null {
  const normalized = normalizeSlug(slug);
  return CATALOG.find((asset) => asset.slug.toLowerCase() === normalized) ?? null;
}

export function findPublicAssetByAddress(address: string): PublicCanonicalAsset | null {
  const normalized = normalizeMantleAddress(address);
  return (
    CATALOG.find((asset) =>
      asset.representations.some((rep) => rep.address.toLowerCase() === normalized),
    ) ?? null
  );
}

// --- match builders ---------------------------------------------------------

function buildCanonicalMatch(asset: PublicCanonicalAsset, matchKind: PublicMatchKind): PublicSearchMatch {
  return {
    kind: "canonical_asset",
    scope: "canonical",
    canonicalPath: `/asset/${asset.slug}`,
    title: asset.symbol,
    slug: asset.slug,
    symbol: asset.symbol,
    name: asset.name,
    address: asset.representations[0]?.address ?? null,
    logoUrl: asset.logoUrl,
    matchKind,
  };
}

function buildSimilarAsset(
  asset: PublicCanonicalAsset,
  matchKind: PublicSimilarAsset["matchKind"],
): PublicSimilarAsset {
  return {
    slug: asset.slug,
    symbol: asset.symbol,
    name: asset.name,
    matchKind,
    canonicalPath: `/asset/${asset.slug}`,
    logoUrl: asset.logoUrl,
  };
}

function buildAddressMatch(address: string, asset: PublicCanonicalAsset | null): PublicSearchMatch {
  const normalizedAddress = normalizeMantleAddress(address);
  return {
    kind: "mantle_asset",
    scope: "chain",
    canonicalPath: `/mantle/asset/${normalizedAddress}`,
    title: asset?.symbol ?? "Mantle asset",
    slug: asset?.slug ?? null,
    symbol: asset?.symbol ?? null,
    name: asset?.name ?? null,
    address: normalizedAddress,
    logoUrl: asset?.logoUrl ?? resolveTokenMediaUrl({ address: normalizedAddress }),
    matchKind: "address",
  };
}

// --- matchers ---------------------------------------------------------------

type AssetMatch = { asset: PublicCanonicalAsset; matchKind: PublicMatchKind };

function findExactMatches(normalizedQuery: string): AssetMatch[] {
  const slugMatch = findPublicAssetBySlug(normalizedQuery);
  if (slugMatch) return [{ asset: slugMatch, matchKind: "exact_slug" }];

  const symbol = normalizedQuery.toUpperCase();
  const symbolMatches = CATALOG.filter((a) => a.symbol.toUpperCase() === symbol);
  if (symbolMatches.length > 0) return symbolMatches.map((asset) => ({ asset, matchKind: "exact_symbol" }));

  const name = normalizedQuery.toLowerCase();
  const nameMatches = CATALOG.filter((a) => a.name.toLowerCase() === name);
  return nameMatches.map((asset) => ({ asset, matchKind: "exact_name" as PublicMatchKind }));
}

function findAliasMatches(normalizedQuery: string): AssetMatch[] {
  const q = normalizedQuery.toLowerCase();
  return CATALOG.filter((a) => a.aliases.some((alias) => alias.toLowerCase() === q)).map((asset) => ({
    asset,
    matchKind: "exact_alias" as PublicMatchKind,
  }));
}

function findPartialMatches(normalizedQuery: string): AssetMatch[] {
  const slugQ = normalizeSlug(normalizedQuery);
  const symbolQ = normalizedQuery.toUpperCase();
  const nameQ = normalizedQuery.toLowerCase();

  const matches: Array<AssetMatch & { priority: number }> = [];
  for (const asset of CATALOG) {
    if (asset.slug.toLowerCase().includes(slugQ)) {
      matches.push({ asset, matchKind: "partial_slug", priority: 1 });
    } else if (asset.symbol.toUpperCase().includes(symbolQ)) {
      matches.push({ asset, matchKind: "partial_symbol", priority: 2 });
    } else if (asset.name.toLowerCase().includes(nameQ)) {
      matches.push({ asset, matchKind: "partial_name", priority: 3 });
    }
  }

  return matches
    .sort((a, b) => a.priority - b.priority || a.asset.slug.localeCompare(b.asset.slug))
    .map(({ asset, matchKind }) => ({ asset, matchKind }));
}

// --- public API -------------------------------------------------------------

export function findSimilarPublicAssets(asset: PublicCanonicalAsset, limit = 8): PublicSimilarAsset[] {
  if (asset.relatedAssetSlugs.length > 0) {
    return asset.relatedAssetSlugs
      .map((slug) => CATALOG.find((candidate) => candidate.slug === slug))
      .filter((candidate): candidate is PublicCanonicalAsset => Boolean(candidate))
      .filter((candidate) => candidate.slug !== asset.slug)
      .slice(0, limit)
      .map((candidate) => buildSimilarAsset(candidate, "related_asset"));
  }

  const collect = (queryValue: string): PublicSimilarAsset[] =>
    findPartialMatches(normalizePublicSearchQuery(queryValue))
      .filter((candidate) => candidate.asset.slug !== asset.slug)
      .slice(0, limit)
      .map((candidate) => buildSimilarAsset(candidate.asset, candidate.matchKind));

  const symbolMatches = collect(asset.symbol);
  if (symbolMatches.length > 0) return symbolMatches;

  const prefix = normalizePublicSearchQuery(asset.symbol).slice(0, 1);
  return prefix ? collect(prefix) : [];
}

export function resolvePublicAssetSearch(queryValue: string): PublicResolveResult {
  const normalizedQuery = normalizePublicSearchQuery(queryValue);

  if (!normalizedQuery) {
    return {
      ok: true,
      query: queryValue,
      normalizedQuery,
      kind: "empty",
      canonicalPath: null,
      matches: [],
      message: "Enter a symbol, asset name, slug, or Mantle address.",
    };
  }

  if (isMantleAddress(normalizedQuery)) {
    const normalizedAddress = normalizeMantleAddress(normalizedQuery);
    const asset = findPublicAssetByAddress(normalizedAddress);
    const match = buildAddressMatch(normalizedAddress, asset);
    return {
      ok: true,
      query: queryValue,
      normalizedQuery: normalizedAddress,
      kind: "redirect",
      canonicalPath: match.canonicalPath,
      matches: [match],
      message: null,
    };
  }

  const exactMatches = findExactMatches(normalizedQuery);
  const aliasMatches = exactMatches.length > 0 ? [] : findAliasMatches(normalizedQuery);
  const matches =
    exactMatches.length > 0
      ? exactMatches.map(({ asset, matchKind }) => buildCanonicalMatch(asset, matchKind))
      : aliasMatches.length > 0
        ? aliasMatches.map(({ asset, matchKind }) => buildCanonicalMatch(asset, matchKind))
        : findPartialMatches(normalizedQuery).map(({ asset, matchKind }) =>
            buildCanonicalMatch(asset, matchKind),
          );

  if (matches.length === 1 && (exactMatches.length === 1 || aliasMatches.length === 1)) {
    return {
      ok: true,
      query: queryValue,
      normalizedQuery,
      kind: "redirect",
      canonicalPath: matches[0]?.canonicalPath ?? null,
      matches,
      message: null,
    };
  }

  if (matches.length > 0) {
    return {
      ok: true,
      query: queryValue,
      normalizedQuery,
      kind: "search_results",
      canonicalPath: null,
      matches,
      message: "Choose a Sentinel-safe canonical asset or Mantle representation.",
    };
  }

  return {
    ok: true,
    query: queryValue,
    normalizedQuery,
    kind: "unknown",
    canonicalPath: null,
    matches: [],
    message: "That input did not resolve to a public Sentinel asset or Mantle address.",
  };
}
