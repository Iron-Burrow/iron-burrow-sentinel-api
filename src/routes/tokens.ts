import type { Context } from "hono";

import { fail, ok } from "../services/responses.js";
import { getToken, getTokenHolders, notIndexed } from "../services/token-service.js";
import type { AppBindings } from "../types.js";

function parseLimit(value: string | undefined): number {
  const parsed = value ? Number(value) : 25;
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 25;
}

export async function tokenRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await getToken(c.get("services"), {
    chain: c.req.param("chain") ?? "",
    network: c.req.param("network") ?? "",
    tokenAddress: c.req.param("token_address") ?? ""
  });

  if (!result.ok) {
    return fail(c, result.status, {
      code: result.code,
      message: result.message,
      details: result.details
    });
  }

  return ok(c, result.data, result.meta);
}

export async function tokenHoldersRoute(c: Context<AppBindings>): Promise<Response> {
  const result = await getTokenHolders(c.get("services"), {
    chain: c.req.param("chain") ?? "",
    network: c.req.param("network") ?? "",
    tokenAddress: c.req.param("token_address") ?? "",
    limit: parseLimit(c.req.query("limit"))
  });

  if (!result.ok) {
    return fail(c, result.status, {
      code: result.code,
      message: result.message,
      details: result.details
    });
  }

  return ok(c, result.data, result.meta);
}

export function tokenTransfersRoute(c: Context<AppBindings>): Response {
  const result = notIndexed({
    chain: c.req.param("chain") ?? "",
    network: c.req.param("network") ?? "",
    resource: "token_transfers"
  });

  return fail(c, result.status, {
    code: result.code,
    message: result.message,
    details: result.details
  });
}

export function addressRoute(c: Context<AppBindings>): Response {
  const result = notIndexed({
    chain: c.req.param("chain") ?? "",
    network: c.req.param("network") ?? "",
    resource: "address"
  });

  return fail(c, result.status, {
    code: result.code,
    message: result.message,
    details: result.details
  });
}

export function transactionRoute(c: Context<AppBindings>): Response {
  const result = notIndexed({
    chain: c.req.param("chain") ?? "",
    network: c.req.param("network") ?? "",
    resource: "transaction"
  });

  return fail(c, result.status, {
    code: result.code,
    message: result.message,
    details: result.details
  });
}
