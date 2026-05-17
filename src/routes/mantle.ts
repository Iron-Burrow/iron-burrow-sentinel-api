import type { Context } from "hono";

import type { AppBindings } from "../types.js";

function parseLimit(rawValue: string | undefined, fallback: number, max: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback;
}

function validateAddress(c: Context<AppBindings>, address: string): Response | null {
  if (!/^0x[a-fA-F0-9]{40}$/u.test(address)) {
    return c.json(
      {
        ok: false,
        code: "INVALID_MANTLE_ADDRESS",
        message: "Address must be a 20-byte EVM address."
      },
      400
    );
  }

  return null;
}

export async function sourcesRoute(c: Context<AppBindings>): Promise<Response> {
  const sources = await c.get("services").mantleProvider.getSources();
  return c.json({
    ok: true,
    sources
  });
}

export async function assetSummaryRoute(c: Context<AppBindings>): Promise<Response> {
  const address = c.req.param("address");
  const invalid = validateAddress(c, address);

  if (invalid) {
    return invalid;
  }

  return c.json({
    ok: true,
    data: await c.get("services").mantleProvider.getAssetSummary(address)
  });
}

export async function assetHoldersRoute(c: Context<AppBindings>): Promise<Response> {
  const address = c.req.param("address");
  const invalid = validateAddress(c, address);

  if (invalid) {
    return invalid;
  }

  return c.json({
    ok: true,
    data: await c.get("services").mantleProvider.getAssetHolders(address, {
      limit: parseLimit(c.req.query("limit"), 25, 100)
    })
  });
}

export async function assetConcentrationRoute(c: Context<AppBindings>): Promise<Response> {
  const address = c.req.param("address");
  const invalid = validateAddress(c, address);

  if (invalid) {
    return invalid;
  }

  return c.json({
    ok: true,
    data: await c.get("services").mantleProvider.getAssetConcentration(address)
  });
}

export async function liquidityDeltaRoute(c: Context<AppBindings>): Promise<Response> {
  return c.json({
    ok: true,
    data: await c.get("services").mantleProvider.getLiquidityDelta()
  });
}

export async function queryRoute(c: Context<AppBindings>): Promise<Response> {
  let body: Record<string, unknown> = {};

  try {
    const parsed = await c.req.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    body = {};
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";

  if (!query) {
    return c.json(
      {
        ok: false,
        code: "QUERY_REQUIRED",
        message: "Provide a query string."
      },
      400
    );
  }

  return c.json({
    ok: true,
    data: await c.get("services").mantleProvider.query({ query })
  });
}
