import type { Context } from "hono";

import type { AppBindings } from "../types.js";

export interface PublicMeta {
  chain?: string;
  network?: string;
  source: string;
  indexed_from_block?: number | null;
  indexed_to_block?: number | null;
  last_synced_at?: string | null;
  partial: boolean;
  stale?: boolean;
  [key: string]: unknown;
}

export interface PublicError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type PublicStatus = 200 | 201 | 400 | 401 | 404 | 429 | 501 | 502 | 503;

export function successPayload<T>(data: T, meta: PublicMeta): { data: T; meta: PublicMeta } {
  return { data, meta };
}

export function errorPayload(error: PublicError): { error: Required<PublicError> } {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details ?? {}
    }
  };
}

export function ok<T>(c: Context<AppBindings>, data: T, meta: PublicMeta, status: 200 | 201 = 200): Response {
  return c.json(successPayload(data, meta), status);
}

export function fail(c: Context<AppBindings>, status: PublicStatus, error: PublicError): Response {
  return c.json(errorPayload(error), status);
}

export const sentinelMeta = (overrides: Partial<PublicMeta> = {}): PublicMeta => ({
  source: "sentinel",
  partial: false,
  stale: false,
  ...overrides
});

export const notIndexedMeta = (overrides: Partial<PublicMeta> = {}): PublicMeta =>
  sentinelMeta({
    partial: true,
    stale: true,
    ...overrides
  });

