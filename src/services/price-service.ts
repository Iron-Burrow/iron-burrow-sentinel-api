import type { AppServices } from "../types.js";
import { listPriceAssets } from "./catalog-service.js";
import { notIndexedMeta, sentinelMeta } from "./responses.js";
import type { ServiceError, ServiceResult } from "./token-service.js";

function safeStatus(status: number): 200 | 400 | 401 | 404 | 429 | 502 | 503 {
  if (status === 200 || status === 400 || status === 401 || status === 404 || status === 429 || status === 503) {
    return status;
  }

  return 502;
}

function normalizeParams(params: URLSearchParams): URLSearchParams {
  const normalized = new URLSearchParams(params);
  const asset = normalized.get("asset");

  if (asset && !normalized.has("symbol")) {
    normalized.set("symbol", asset);
  }

  return normalized;
}

export async function getPriceAssets(services: AppServices) {
  return listPriceAssets(services);
}

export async function getLatestPrice(
  services: AppServices,
  params: URLSearchParams
): Promise<ServiceResult<unknown> | ServiceError> {
  const result = await services.priceQlClient.requestLatest(normalizeParams(params));

  if (result.status !== 200) {
    return {
      ok: false,
      status: safeStatus(result.status),
      code: "PRICE_BACKEND_UNAVAILABLE",
      message: "Sentinel could not read latest price data from the private price backend.",
      details: { backend_status: result.status, backend_payload: result.payload },
      meta: notIndexedMeta({ source: "sentinel-price-service" })
    };
  }

  return {
    ok: true,
    data: result.payload,
    meta: sentinelMeta({ source: "sentinel-price-service", partial: false, stale: false })
  };
}

export async function getPriceHistory(
  services: AppServices,
  params: URLSearchParams
): Promise<ServiceResult<unknown> | ServiceError> {
  const normalized = normalizeParams(params);

  if (!normalized.has("range")) {
    normalized.set("range", services.env.PRICE_SERIES_DEFAULT_RANGE);
  }

  const result = await services.priceQlClient.requestSeries(normalized);

  if (result.status !== 200) {
    return {
      ok: false,
      status: safeStatus(result.status),
      code: "PRICE_BACKEND_UNAVAILABLE",
      message: "Sentinel could not read historical price data from the private price backend.",
      details: { backend_status: result.status, backend_payload: result.payload },
      meta: notIndexedMeta({ source: "sentinel-price-service" })
    };
  }

  return {
    ok: true,
    data: result.payload,
    meta: sentinelMeta({ source: "sentinel-price-service", partial: false, stale: false })
  };
}

export function getPriceAt(): ServiceError {
  return {
    ok: false,
    status: 501,
    code: "NOT_INDEXED_YET",
    message: "Timestamp price lookup is not available in Sentinel Alpha 1.",
    details: { resource: "price_at" },
    meta: notIndexedMeta({ source: "sentinel-price-service" })
  };
}

