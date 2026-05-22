import { listPublicAssets, resolvePublicAssetSearch } from "../db/public-assets.js";
import type { AppServices } from "../types.js";
import { sentinelMeta } from "./responses.js";

export async function searchCatalog(services: AppServices, query: string) {
  const result = await resolvePublicAssetSearch(services.env.DATABASE_URL, query);
  return {
    data: {
      query: result.query,
      normalized_query: result.normalizedQuery,
      kind: result.kind,
      canonical_path: result.canonicalPath,
      matches: result.matches,
      message: result.message
    },
    meta: sentinelMeta({
      source: "sentinel-public-catalog",
      partial: true
    })
  };
}

export async function listPriceAssets(services: AppServices) {
  const assets = await listPublicAssets(services.env.DATABASE_URL);
  return {
    data: assets.map((asset) => ({
      asset: asset.symbol,
      slug: asset.slug,
      name: asset.name,
      kind: asset.assetKind,
      aliases: asset.aliases,
      representations: asset.representations.map((representation) => ({
        chain: representation.chain,
        network: "mainnet",
        token_address: representation.address,
        symbol: representation.symbol,
        name: representation.name,
        indexed_status: representation.indexedStatus
      }))
    })),
    meta: sentinelMeta({
      source: "sentinel-public-catalog",
      partial: true
    })
  };
}

