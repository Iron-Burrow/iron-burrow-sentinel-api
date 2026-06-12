import { NextResponse } from "next/server";

import { getSql, isDatabaseConfigured } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  let dbOk = false;
  let latencyMs: number | null = null;

  if (isDatabaseConfigured()) {
    try {
      const sql = getSql();
      const start = Date.now();
      await sql`select 1`;
      latencyMs = Date.now() - start;
      dbOk = true;
    } catch {
      dbOk = false;
    }
  }

  return NextResponse.json({
    ok: true,
    service: "iron-burrow-sentinel-api",
    version: "0.1.0",
    environment: process.env.NODE_ENV ?? "development",
    database: { ok: dbOk, latency_ms: latencyMs, configured: isDatabaseConfigured() },
    public_boundary: {
      exposes_private_rpc: false,
      exposes_private_indexers: false,
      exposes_internal_gateway: false,
    },
    data_availability: {
      primary_chain: "mantle",
      mode: "demo-provider",
      is_partial: true,
      message:
        "Sentinel is serving mock Mantle demo data until private providers are connected behind the public interface.",
    },
  });
}
