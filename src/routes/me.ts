import type { Context } from "hono";

import { listApiKeys } from "../db/api-keys.js";
import { getUsageSummary } from "../db/usage.js";
import type { AppBindings } from "../types.js";

export async function meRoute(c: Context<AppBindings>): Promise<Response> {
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  return c.json({
    ok: true,
    user: auth.user,
    api_key: {
      id: auth.apiKey.id,
      name: auth.apiKey.name,
      keyPrefix: auth.apiKey.keyPrefix,
      status: auth.apiKey.status,
      lastUsedAt: auth.apiKey.lastUsedAt,
      createdAt: auth.apiKey.createdAt
    }
  });
}

export async function usageRoute(c: Context<AppBindings>): Promise<Response> {
  const services = c.get("services");
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  const [usage, keys] = await Promise.all([
    getUsageSummary(services.env.DATABASE_URL, auth.user.id),
    listApiKeys(services.env.DATABASE_URL, auth.user.id)
  ]);

  return c.json({
    ok: true,
    user: auth.user,
    usage,
    keys
  });
}
