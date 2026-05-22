import type { Context } from "hono";

import { getCapabilities, getChains, getNetworks, getStatus } from "../services/status-service.js";
import type { AppBindings } from "../types.js";

export async function statusRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await getStatus(c.get("services"));

  return c.json({
    ...result.data,
    data: result.data,
    meta: result.meta
  });
}

export function healthRoute(c: Context<AppBindings>): Response {
  return c.json({
    ok: true,
    service: "iron-burrow-sentinel-api",
    message: "Sentinel is ready to serve public requests."
  });
}

export function chainsRoute(c: Context<AppBindings>): Response {
  const result = getChains();
  return c.json(result);
}

export function networksRoute(c: Context<AppBindings>): Response {
  const result = getNetworks();
  return c.json(result);
}

export function capabilitiesRoute(c: Context<AppBindings>): Response {
  const result = getCapabilities(c.get("services"));
  return c.json(result);
}
