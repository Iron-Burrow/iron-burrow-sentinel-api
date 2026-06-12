import "server-only";

import { createHash } from "node:crypto";

import { findPublicAssetByAddress } from "./catalog";
import {
  getAssetConcentration,
  getAssetHolders,
  getAssetSummary,
  getLiquidityDelta,
} from "./mantle-provider";
import { resolveTokenMediaUrl } from "./token-media";
import type { PublicMantleAssetPayload } from "./types";

// Stable 20-byte address derived from an asset slug. Used so the synthetic
// Mantle provider returns consistent demo data for assets that have no real
// Mantle chain map.
export function deriveDemoAddress(slug: string): string {
  const hex = createHash("sha256").update(`mantle-demo:${slug}`).digest("hex").slice(0, 40);
  return `0x${hex}`;
}

export function buildPublicMantleAssetPayload(address: string): PublicMantleAssetPayload {
  const summary = getAssetSummary(address);
  const holders = getAssetHolders(address, { limit: 10 });
  const concentration = getAssetConcentration(address);
  const catalogAsset = findPublicAssetByAddress(address);
  const liquidityDelta = getLiquidityDelta();
  const liquiditySignal =
    liquidityDelta.signals.find((signal) => signal.asset_address === address) ?? null;

  return {
    chain: "mantle",
    address,
    summary,
    holders,
    concentration,
    catalogAsset,
    logoUrl:
      catalogAsset?.logoUrl ??
      resolveTokenMediaUrl({ address, symbol: summary.symbol, name: summary.name }),
    liquiditySignal,
    publicBoundary: {
      exposesPrivateRpc: false,
      exposesPrivateIndexers: false,
      exposesInternalGateway: false,
    },
  };
}
