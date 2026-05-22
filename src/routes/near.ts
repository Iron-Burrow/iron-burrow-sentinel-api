import type { Context } from "hono";

import { fail } from "../services/responses.js";
import { nearNotConnected } from "../services/near-service.js";
import type { AppBindings } from "../types.js";

function respond(c: Context<AppBindings>, resource: string): Response {
  const result = nearNotConnected(resource, c.req.param("account_id"));
  return fail(c, result.status, {
    code: result.code,
    message: result.message,
    details: result.details
  });
}

export function nearValidatorsRoute(c: Context<AppBindings>): Response {
  return respond(c, "near_validators");
}

export function nearValidatorRoute(c: Context<AppBindings>): Response {
  return respond(c, "near_validator");
}

export function nearValidatorSnapshotsRoute(c: Context<AppBindings>): Response {
  return respond(c, "near_validator_snapshots");
}

export function nearValidatorStatusRoute(c: Context<AppBindings>): Response {
  return respond(c, "near_validator_status");
}

