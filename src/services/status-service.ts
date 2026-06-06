import { checkDb } from "../db/client.js";
import type { AppServices } from "../types.js";
import { sentinelMeta, type PublicMeta } from "./responses.js";

export async function getStatus(services: AppServices) {
  const db = await checkDb(services.env.DATABASE_URL);
  const data = {
    ok: true,
    service: "iron-burrow-sentinel-api",
    version: process.env.npm_package_version ?? "0.1.0",
    environment: services.env.NODE_ENV,
    database: {
      ok: db.ok,
      latency_ms: db.latencyMs
    },
    price_backend: {
      mode: services.env.PRICE_BACKEND,
      configured: services.priceQlClient.configured
    },
    public_boundary: {
      exposes_private_rpc: false,
      exposes_private_indexers: false,
      exposes_internal_gateway: false
    },
    data_availability: {
      primary_chain: "mantle",
      mode: "demo-provider",
      is_partial: true,
      message: "Sentinel is serving mock Mantle demo data until private providers are connected behind the public interface."
    }
  };

  return {
    data,
    meta: sentinelMeta({
      source: "sentinel-status",
      partial: true,
      stale: false
    })
  };
}

export function getChains() {
  return {
    data: [
      {
        chain: "mantle",
        display_name: "Mantle",
        status: "alpha",
        partial: true,
        public_rpc_exposed: false
      }
    ],
    meta: sentinelMeta({ source: "sentinel-capabilities", partial: true })
  };
}

export function getNetworks() {
  return {
    data: [
      {
        chain: "mantle",
        network: "mainnet",
        status: "alpha",
        indexed: "partial-demo",
        public_rpc_exposed: false
      }
    ],
    meta: sentinelMeta({ source: "sentinel-capabilities", partial: true })
  };
}

export function getCapabilities(services: AppServices) {
  return {
    data: {
      status: true,
      scan_search: true,
      token_summary: true,
      token_holders: true,
      token_transfers: false,
      address_summary: false,
      transaction_lookup: false,
      prices: {
        latest: services.priceQlClient.configured,
        history: services.priceQlClient.configured,
        at: false,
        assets: true
      },
      infra: {
        status: "stub",
        routes: "stub",
        raw_rpc: false
      },
      near_validators: false,
      auth_usage: true,
      signals: true
    },
    meta: sentinelMeta({ source: "sentinel-capabilities", partial: true })
  };
}

export function routeMeta(chain?: string, network?: string): PublicMeta {
  return sentinelMeta({
    chain,
    network,
    source: "sentinel-capabilities",
    partial: true
  });
}

