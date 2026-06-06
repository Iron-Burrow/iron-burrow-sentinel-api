import type { Context } from "hono";

import { getMe, getMyApiKeys, getMyRateLimits, getMyUsage } from "../services/account-service.js";
import { ok } from "../services/responses.js";
import type { AppBindings } from "../types.js";

export async function meRoute(c: Context<AppBindings>): Promise<Response> {
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  const result = await getMe(auth);
  return ok(c, result.data, result.meta);
}

export async function usageRoute(c: Context<AppBindings>): Promise<Response> {
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  const result = await getMyUsage(c.get("services"), auth);

  return ok(c, result.data, result.meta);
}

export async function meApiKeysRoute(c: Context<AppBindings>): Promise<Response> {
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  const result = await getMyApiKeys(c.get("services"), auth);
  return ok(c, result.data, result.meta);
}

export function meRateLimitsRoute(c: Context<AppBindings>): Response {
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  const result = getMyRateLimits(c.get("services"), auth);
  return ok(c, result.data, result.meta);
}
