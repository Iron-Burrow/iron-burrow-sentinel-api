import type { MantleAssetSummary, MantleConcentrationResponse, MantleHoldersResponse } from "./providers/mantle-provider.js";

export type PublicAssetChain = "mantle";
export type PublicAssetIndexedStatus = "partial" | "demo";
export type PublicAssetKind = "canonical" | "native" | "commodity";

export interface PublicAssetRepresentation {
  chain: PublicAssetChain;
  address: string;
  canonicalPath: string;
  indexedStatus: PublicAssetIndexedStatus;
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
  relatedAssetSlugs: string[];
  tags: string[];
  representations: PublicAssetRepresentation[];
}

export interface PublicSimilarAsset {
  slug: string;
  symbol: string;
  name: string;
  matchKind: PublicSearchMatch["matchKind"] | "related_asset";
  canonicalPath: string;
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
  matchKind:
    | "address"
    | "exact_symbol"
    | "exact_slug"
    | "exact_name"
    | "exact_alias"
    | "partial_symbol"
    | "partial_slug"
    | "partial_name";
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
  publicBoundary: {
    exposesPrivateRpc: false;
    exposesPrivateIndexers: false;
    exposesInternalGateway: false;
  };
}

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
