import type { Context } from "hono";

import { checkDb } from "../db/client.js";
import type { AppBindings } from "../types.js";

export async function statusRoute(c: Context<AppBindings>): Promise<Response> {
  const services = c.get("services");
  const db = await checkDb(services.env.DATABASE_URL);

  return c.json({
    ok: true,
    service: "iron-burrow-sentinel-api",
    version: process.env.npm_package_version ?? "0.1.0",
    environment: services.env.NODE_ENV,
    database: {
      ok: db.ok,
      latency_ms: db.latencyMs
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
  });
}

export function healthRoute(c: Context<AppBindings>): Response {
  return c.json({
    ok: true,
    service: "iron-burrow-sentinel-api",
    message: "Sentinel is ready to serve public requests."
  });
}
