import { findPublicAssetByAddress } from "../db/public-assets.js";
import { isMantleAddress, normalizeMantleAddress } from "../public-catalog.js";
import type { AppServices } from "../types.js";
import { notIndexedMeta, sentinelMeta, type PublicStatus } from "./responses.js";

export interface ServiceResult<T> {
  ok: true;
  data: T;
  meta: ReturnType<typeof sentinelMeta>;
}

export interface ServiceError {
  ok: false;
  status: PublicStatus;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  meta?: ReturnType<typeof sentinelMeta>;
}

function assertMantleMainnet(chain: string, network: string): ServiceError | null {
  if (chain !== "mantle" || network !== "mainnet") {
    return {
      ok: false,
      status: 501,
      code: "NETWORK_NOT_INDEXED",
      message: "Sentinel Alpha 1 only exposes partial Mantle mainnet demo token data.",
      details: { chain, network },
      meta: notIndexedMeta({ chain, network, source: "sentinel-token-service" })
    };
  }

  return null;
}

function assertAddress(address: string): ServiceError | null {
  if (!isMantleAddress(address)) {
    return {
      ok: false,
      status: 400,
      code: "INVALID_EVM_ADDRESS",
      message: "Address must be a 20-byte EVM address.",
      details: { address }
    };
  }

  return null;
}

export async function getToken(
  services: AppServices,
  input: { chain: string; network: string; tokenAddress: string }
): Promise<ServiceResult<unknown> | ServiceError> {
  const unsupported = assertMantleMainnet(input.chain, input.network);
  const invalid = assertAddress(input.tokenAddress);

  if (unsupported) {
    return unsupported;
  }

  if (invalid) {
    return invalid;
  }

  const address = normalizeMantleAddress(input.tokenAddress);
  const [summary, concentration, catalogAsset] = await Promise.all([
    services.mantleProvider.getAssetSummary(address),
    services.mantleProvider.getAssetConcentration(address),
    findPublicAssetByAddress(services.env.DATABASE_URL, address)
  ]);

  return {
    ok: true,
    data: {
      chain: input.chain,
      network: input.network,
      token_address: address,
      summary,
      concentration,
      catalog_asset: catalogAsset
    },
    meta: sentinelMeta({
      chain: input.chain,
      network: input.network,
      source: summary.metadata.source,
      indexed_from_block: null,
      indexed_to_block: summary.metadata.indexed_until_block,
      last_synced_at: null,
      partial: summary.metadata.is_partial,
      stale: false
    })
  };
}

export async function getTokenHolders(
  services: AppServices,
  input: { chain: string; network: string; tokenAddress: string; limit: number }
): Promise<ServiceResult<unknown> | ServiceError> {
  const unsupported = assertMantleMainnet(input.chain, input.network);
  const invalid = assertAddress(input.tokenAddress);

  if (unsupported) {
    return unsupported;
  }

  if (invalid) {
    return invalid;
  }

  const address = normalizeMantleAddress(input.tokenAddress);
  const holders = await services.mantleProvider.getAssetHolders(address, { limit: input.limit });

  return {
    ok: true,
    data: {
      chain: input.chain,
      network: input.network,
      token_address: address,
      holders: holders.holders,
      page: holders.page
    },
    meta: sentinelMeta({
      chain: input.chain,
      network: input.network,
      source: holders.metadata.source,
      indexed_from_block: null,
      indexed_to_block: holders.metadata.indexed_until_block,
      last_synced_at: null,
      partial: holders.metadata.is_partial,
      stale: false
    })
  };
}

export function notIndexed(
  input: { chain?: string; network?: string; resource: string },
  message = "This route is part of the Sentinel public contract, but this data is not indexed yet."
): ServiceError {
  return {
    ok: false,
    status: 501,
    code: "NOT_INDEXED_YET",
    message,
    details: { resource: input.resource },
    meta: notIndexedMeta({
      chain: input.chain,
      network: input.network,
      source: "sentinel-alpha-stub"
    })
  };
}
