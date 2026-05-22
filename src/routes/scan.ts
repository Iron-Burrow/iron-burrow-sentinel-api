import type { Context } from "hono";

import { searchCatalog } from "../services/catalog-service.js";
import { ok } from "../services/responses.js";
import type { AppBindings } from "../types.js";

export async function scanSearchRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await searchCatalog(c.get("services"), c.req.query("q") ?? "");
  return ok(c, result.data, result.meta);
}

