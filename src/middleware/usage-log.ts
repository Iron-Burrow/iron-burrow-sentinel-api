import type { MiddlewareHandler } from "hono";

import { logUsage } from "../db/usage.js";
import type { AppBindings } from "../types.js";

export const usageLogMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  await next();

  const services = c.get("services");
  const auth = c.get("auth");
  const startedAt = c.get("startedAt") ?? Date.now();

  try {
    await logUsage(services.env.DATABASE_URL, {
      requestId: c.get("requestId"),
      userId: auth?.user.id ?? null,
      apiKeyId: auth?.apiKey.id ?? null,
      endpoint: new URL(c.req.url).pathname,
      method: c.req.method,
      statusCode: c.res.status,
      latencyMs: Math.max(Date.now() - startedAt, 0),
      costUnits: c.get("costUnits") ?? 1
    });
  } catch (error) {
    console.warn("[usage-log] failed to persist request usage", error);
  }
};
