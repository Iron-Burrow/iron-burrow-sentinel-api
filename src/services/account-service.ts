import { listApiKeys } from "../db/api-keys.js";
import { getUsageSummary } from "../db/usage.js";
import type { AuthContext, AppServices } from "../types.js";
import { sentinelMeta } from "./responses.js";

export async function getMe(auth: AuthContext) {
  return {
    data: {
      user: auth.user,
      api_key: {
        id: auth.apiKey.id,
        name: auth.apiKey.name,
        keyPrefix: auth.apiKey.keyPrefix,
        status: auth.apiKey.status,
        lastUsedAt: auth.apiKey.lastUsedAt,
        createdAt: auth.apiKey.createdAt
      }
    },
    meta: sentinelMeta({ source: "sentinel-account-service" })
  };
}

export async function getMyApiKeys(services: AppServices, auth: AuthContext) {
  return {
    data: {
      keys: await listApiKeys(services.env.DATABASE_URL, auth.user.id)
    },
    meta: sentinelMeta({ source: "sentinel-account-service" })
  };
}

export async function getMyUsage(services: AppServices, auth: AuthContext) {
  const [usage, keys] = await Promise.all([
    getUsageSummary(services.env.DATABASE_URL, auth.user.id),
    listApiKeys(services.env.DATABASE_URL, auth.user.id)
  ]);

  return {
    data: {
      user: auth.user,
      usage,
      keys
    },
    meta: sentinelMeta({ source: "sentinel-account-service" })
  };
}

export function getMyRateLimits(services: AppServices, auth: AuthContext) {
  return {
    data: {
      api_key: {
        id: auth.apiKey.id,
        name: auth.apiKey.name,
        status: auth.apiKey.status
      },
      window_seconds: services.env.RATE_LIMIT_WINDOW_SECONDS,
      request_limit: services.env.RATE_LIMIT_REQUESTS,
      cost_unit_limit: services.env.RATE_LIMIT_COST_UNITS
    },
    meta: sentinelMeta({ source: "sentinel-account-service" })
  };
}

