import type { Context } from "hono";

import { getPriceAssets } from "../services/price-service.js";
import { ok } from "../services/responses.js";
import type { AppBindings } from "../types.js";

export async function priceAssetsRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await getPriceAssets(c.get("services"));
  return ok(c, result.data, result.meta);
}

