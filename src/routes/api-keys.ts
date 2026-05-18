import type { Context } from "hono";

import {
  createApiKey,
  generateApiKey,
  getApiKeyPrefix,
  hashApiKey,
  listApiKeys,
  revokeApiKey,
  toPublicApiKey
} from "../db/api-keys.js";
import { createOrGetUser } from "../db/users.js";
import type { AppBindings } from "../types.js";

async function readJson(c: Context): Promise<Record<string, unknown>> {
  try {
    const body = await c.req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function readRequiredString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function createApiKeyRoute(c: Context<AppBindings>): Promise<Response> {
  const services = c.get("services");
  const body = await readJson(c);
  const email = readRequiredString(body, "email");
  const name = readRequiredString(body, "name");
  const keyName = readRequiredString(body, "keyName") ?? "Hackathon key";
  const mode = body.mode === "live" ? "live" : "test";

  if (!email || !email.includes("@") || !name) {
    return c.json(
      {
        ok: false,
        code: "USER_DETAILS_REQUIRED",
        message: "Provide a valid email and name to create a Sentinel API key."
      },
      400
    );
  }

  const user = await createOrGetUser(services.env.DATABASE_URL, { email, name });
  const apiKey = generateApiKey(mode);
  const key = await createApiKey(services.env.DATABASE_URL, {
    userId: user.id,
    name: keyName,
    keyPrefix: getApiKeyPrefix(apiKey),
    keyHash: hashApiKey(apiKey, services.env.API_KEY_HASH_SECRET)
  });

  return c.json(
    {
      ok: true,
      user,
      key: toPublicApiKey(key),
      api_key: apiKey,
      warning: "This is the only time the full API key will be returned."
    },
    201
  );
}

export async function listApiKeysRoute(c: Context<AppBindings>): Promise<Response> {
  const services = c.get("services");
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  const keys = await listApiKeys(services.env.DATABASE_URL, auth.user.id);
  return c.json({ ok: true, keys });
}

export async function revokeApiKeyRoute(c: Context<AppBindings>): Promise<Response> {
  const services = c.get("services");
  const auth = c.get("auth");

  if (!auth) {
    return c.json({ ok: false, code: "API_KEY_REQUIRED", message: "API key required." }, 401);
  }

  const key = await revokeApiKey(services.env.DATABASE_URL, {
    userId: auth.user.id,
    apiKeyId: c.req.param("id") ?? ""
  });

  if (!key) {
    return c.json(
      {
        ok: false,
        code: "API_KEY_NOT_FOUND",
        message: "No API key was found for this user and id."
      },
      404
    );
  }

  return c.json({ ok: true, key });
}
