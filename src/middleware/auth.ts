import type { MiddlewareHandler } from "hono";

import {
  findActiveApiKeysByPrefix,
  getApiKeyPrefix,
  hashApiKey,
  hashesMatch,
  touchApiKey
} from "../db/api-keys.js";
import { getUserById } from "../db/users.js";
import type { AppBindings } from "../types.js";

function readApiKey(headers: Headers): string | null {
  const authorization = headers.get("authorization")?.trim();

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return headers.get("x-api-key")?.trim() || null;
}

export const requireApiKey: MiddlewareHandler<AppBindings> = async (c, next) => {
  const services = c.get("services");
  const rawApiKey = readApiKey(c.req.raw.headers);

  if (!rawApiKey) {
    return c.json(
      {
        ok: false,
        code: "API_KEY_REQUIRED",
        message: "Provide an API key with Authorization: Bearer <key> or X-API-Key."
      },
      401
    );
  }

  const keyHash = hashApiKey(rawApiKey, services.env.API_KEY_HASH_SECRET);
  const candidates = await findActiveApiKeysByPrefix(services.env.DATABASE_URL, getApiKeyPrefix(rawApiKey));
  const apiKey = candidates.find((candidate) => hashesMatch(candidate.keyHash, keyHash)) ?? null;

  if (!apiKey) {
    return c.json(
      {
        ok: false,
        code: "API_KEY_INVALID",
        message: "The API key is invalid or revoked."
      },
      401
    );
  }

  const user = await getUserById(services.env.DATABASE_URL, apiKey.userId);

  if (!user) {
    return c.json(
      {
        ok: false,
        code: "API_KEY_USER_MISSING",
        message: "The API key is not attached to an active user."
      },
      401
    );
  }

  c.set("auth", { apiKey, user });
  await touchApiKey(services.env.DATABASE_URL, apiKey.id);
  await next();
};
