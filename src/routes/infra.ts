import type { Context } from "hono";

import { getInfraRoute, getInfraRoutes, getInfraStatus } from "../services/infra-service.js";
import { fail, ok } from "../services/responses.js";
import type { AppBindings } from "../types.js";

export function infraStatusRoute(c: Context<AppBindings>): Response {
  const result = getInfraStatus();
  return ok(c, result.data, result.meta);
}

export function infraRoutesRoute(c: Context<AppBindings>): Response {
  const result = getInfraRoutes();
  return ok(c, result.data, result.meta);
}

export function infraRouteRoute(c: Context<AppBindings>): Response {
  const result = getInfraRoute(c.req.param("route_id") ?? "");
  return fail(c, result.status, {
    code: result.code,
    message: result.message,
    details: result.details
  });
}
