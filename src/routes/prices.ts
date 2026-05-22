import type { Context } from "hono";

import { fail, ok } from "../services/responses.js";
import { getLatestPrice, getPriceAt, getPriceHistory } from "../services/price-service.js";
import type { AppBindings } from "../types.js";

function cloneSearchParams(c: Context<AppBindings>): URLSearchParams {
  return new URL(c.req.url).searchParams;
}

function safeStatus(status: number): 200 | 400 | 401 | 404 | 429 | 502 | 503 {
  if (status === 200 || status === 400 || status === 401 || status === 404 || status === 429 || status === 503) {
    return status;
  }

  return 502;
}

export async function latestPriceRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await getLatestPrice(c.get("services"), cloneSearchParams(c));

  if (!result.ok) {
    return fail(c, result.status, {
      code: result.code,
      message: result.message,
      details: result.details
    });
  }

  return ok(c, result.data, result.meta);
}

export async function priceSeriesRoute(c: Context<AppBindings>): Promise<Response> {
  const params = cloneSearchParams(c);

  if (!params.has("range")) {
    params.set("range", c.get("services").env.PRICE_SERIES_DEFAULT_RANGE);
  }

  const result = await c.get("services").priceQlClient.requestSeries(params);
  return c.json(result.payload, safeStatus(result.status));
}

export async function priceHistoryRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await getPriceHistory(c.get("services"), cloneSearchParams(c));

  if (!result.ok) {
    return fail(c, result.status, {
      code: result.code,
      message: result.message,
      details: result.details
    });
  }

  return ok(c, result.data, result.meta);
}

export function priceAtRoute(c: Context<AppBindings>): Response {
  const result = getPriceAt();
  return fail(c, result.status, {
    code: result.code,
    message: result.message,
    details: result.details
  });
}
