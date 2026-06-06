import type { Context } from "hono";

import { fail, ok } from "../services/responses.js";
import { listSignals, querySentinel } from "../services/signal-service.js";
import { notIndexed } from "../services/token-service.js";
import type { AppBindings } from "../types.js";

async function readJson(c: Context): Promise<Record<string, unknown>> {
  try {
    const body = await c.req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function signalsRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await listSignals(c.get("services"));
  return ok(c, result.data, result.meta);
}

export function signalRoute(c: Context<AppBindings>): Response {
  const result = notIndexed({ resource: "signal" }, "Stable individual signal lookup is not available in Sentinel Alpha 1.");
  return fail(c, result.status, {
    code: result.code,
    message: result.message,
    details: { ...result.details, signal_id: c.req.param("signal_id") }
  });
}

export async function sentinelQueryRoute(c: Context<AppBindings>): Promise<Response> {
  const body = await readJson(c);
  const query = typeof body.query === "string" ? body.query.trim() : "";

  if (!query) {
    return fail(c, 400, {
      code: "QUERY_REQUIRED",
      message: "Provide a query string."
    });
  }

  const result = await querySentinel(c.get("services"), query);
  return ok(c, result.data, result.meta);
}

