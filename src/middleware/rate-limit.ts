import type { MiddlewareHandler } from "hono";

import { incrementRateLimitBucket } from "../db/usage.js";
import type { AppBindings } from "../types.js";

function getWindowStart(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export const rateLimitMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const services = c.get("services");
  const auth = c.get("auth");

  if (!auth) {
    await next();
    return;
  }

  const now = new Date();
  const windowStart = getWindowStart(now, services.env.RATE_LIMIT_WINDOW_SECONDS);
  const resetAt = new Date(windowStart.getTime() + services.env.RATE_LIMIT_WINDOW_SECONDS * 1000);
  const costUnits = c.get("costUnits") ?? 1;
  const bucket = await incrementRateLimitBucket(services.env.DATABASE_URL, {
    apiKeyId: auth.apiKey.id,
    windowStart,
    windowSeconds: services.env.RATE_LIMIT_WINDOW_SECONDS,
    costUnits
  });

  const requestsRemaining = Math.max(services.env.RATE_LIMIT_REQUESTS - bucket.requestCount, 0);
  const costRemaining = Math.max(services.env.RATE_LIMIT_COST_UNITS - bucket.costUnits, 0);
  const remaining = Math.min(requestsRemaining, costRemaining);

  c.header("X-RateLimit-Limit", String(services.env.RATE_LIMIT_REQUESTS));
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(resetAt.getTime() / 1000)));

  if (bucket.requestCount > services.env.RATE_LIMIT_REQUESTS || bucket.costUnits > services.env.RATE_LIMIT_COST_UNITS) {
    c.header("Retry-After", String(Math.max(Math.ceil((resetAt.getTime() - now.getTime()) / 1000), 1)));
    return c.json(
      {
        ok: false,
        code: "RATE_LIMITED",
        message: "This API key has exceeded its current rate limit window."
      },
      429
    );
  }

  await next();
};
