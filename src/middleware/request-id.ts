import { randomUUID } from "node:crypto";

import type { MiddlewareHandler } from "hono";

import type { AppBindings } from "../types.js";

export const requestIdMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const requestId = c.req.header("x-request-id")?.trim() || randomUUID();
  c.set("requestId", requestId);
  c.set("startedAt", Date.now());
  c.set("costUnits", 1);
  c.set("auth", null);
  c.header("x-request-id", requestId);
  await next();
};
