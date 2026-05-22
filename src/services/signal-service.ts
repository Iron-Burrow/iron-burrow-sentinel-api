import type { AppServices } from "../types.js";
import { sentinelMeta } from "./responses.js";

export async function listSignals(services: AppServices) {
  const liquidity = await services.mantleProvider.getLiquidityDelta();

  return {
    data: liquidity.signals.map((signal, index) => ({
      id: `liquidity-delta-${index + 1}`,
      type: "liquidity_delta",
      chain: liquidity.chain,
      network: "mainnet",
      ...signal
    })),
    meta: sentinelMeta({
      chain: liquidity.chain,
      network: "mainnet",
      source: liquidity.metadata.source,
      indexed_from_block: null,
      indexed_to_block: liquidity.metadata.indexed_until_block,
      last_synced_at: null,
      partial: liquidity.metadata.is_partial,
      stale: false
    })
  };
}

export async function querySentinel(services: AppServices, query: string) {
  const answer = await services.mantleProvider.query({ query });

  return {
    data: {
      query: answer.query,
      answer: answer.answer,
      routes_used: answer.routes_used
    },
    meta: sentinelMeta({
      source: answer.metadata.source,
      indexed_from_block: null,
      indexed_to_block: answer.metadata.indexed_until_block,
      last_synced_at: null,
      partial: answer.metadata.is_partial,
      stale: false
    })
  };
}

