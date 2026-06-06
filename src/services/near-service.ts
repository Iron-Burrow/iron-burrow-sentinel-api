import { notIndexedMeta } from "./responses.js";
import type { ServiceError } from "./token-service.js";

export function nearNotConnected(resource: string, accountId?: string): ServiceError {
  return {
    ok: false,
    status: 501,
    code: "NOT_CONNECTED_YET",
    message: "NEAR validator indexing is not connected in Sentinel Alpha 1.",
    details: { resource, account_id: accountId ?? null },
    meta: notIndexedMeta({
      chain: "near",
      network: "mainnet",
      source: "sentinel-near-service"
    })
  };
}

