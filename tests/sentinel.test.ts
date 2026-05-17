import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../src/app.js";
import { generateApiKey, getApiKeyPrefix, hashApiKey, hashesMatch } from "../src/db/api-keys.js";
import type { SentinelEnv } from "../src/env.js";

function testEnv(overrides: Partial<SentinelEnv> = {}): SentinelEnv {
  return {
    NODE_ENV: "test",
    PORT: 3000,
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@postgres:5432/iron_burrow_sentinel",
    API_KEY_HASH_SECRET: "test-api-key-hash-secret",
    SESSION_SECRET: "test-session-secret",
    RATE_LIMIT_WINDOW_SECONDS: 60,
    RATE_LIMIT_REQUESTS: 60,
    RATE_LIMIT_COST_UNITS: 600,
    ...overrides
  };
}

async function createKey(app: ReturnType<typeof createApp>): Promise<string> {
  const response = await app.request("/v1/api-keys", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: `builder-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      name: "Test Builder",
      keyName: "Test key"
    })
  });

  const payload = (await response.json()) as { api_key: string };
  assert.equal(response.status, 201);
  assert.match(payload.api_key, /^ibs_test_/u);
  return payload.api_key;
}

test("API key generation hashes keys and keeps stable prefixes", () => {
  const key = generateApiKey("test");
  const hash = hashApiKey(key, "secret");

  assert.match(key, /^ibs_test_/u);
  assert.equal(getApiKeyPrefix(key), key.slice(0, 18));
  assert.equal(hashesMatch(hash, hashApiKey(key, "secret")), true);
  assert.equal(hashesMatch(hash, hashApiKey(`${key}x`, "secret")), false);
});

test("public UI and status routes boot without private infrastructure details", async () => {
  const app = createApp({ env: testEnv() });

  const landing = await app.request("/");
  const docs = await app.request("/docs");
  const status = await app.request("/v1/status");
  const sources = await app.request("/v1/sources");
  const statusPayload = (await status.json()) as {
    public_boundary: {
      exposes_private_rpc: boolean;
      exposes_private_indexers: boolean;
      exposes_internal_gateway: boolean;
    };
  };

  assert.equal(landing.status, 200);
  assert.match(await landing.text(), /Iron Burrow Sentinel/u);
  assert.equal(docs.status, 200);
  assert.equal(status.status, 200);
  assert.equal(sources.status, 200);
  assert.equal(statusPayload.public_boundary.exposes_private_rpc, false);
  assert.equal(statusPayload.public_boundary.exposes_private_indexers, false);
  assert.equal(statusPayload.public_boundary.exposes_internal_gateway, false);
});

test("protected Sentinel routes accept generated API keys and return partial metadata", async () => {
  const app = createApp({ env: testEnv() });
  const apiKey = await createKey(app);
  const headers = { authorization: `Bearer ${apiKey}` };

  const me = await app.request("/v1/me", { headers });
  const usage = await app.request("/v1/me/usage", { headers });
  const keys = await app.request("/v1/api-keys", { headers });
  const summary = await app.request("/v1/mantle/assets/0x1111111111111111111111111111111111111111/summary", {
    headers
  });
  const holders = await app.request("/v1/mantle/assets/0x1111111111111111111111111111111111111111/holders", {
    headers
  });
  const concentration = await app.request(
    "/v1/mantle/assets/0x1111111111111111111111111111111111111111/concentration",
    { headers }
  );
  const liquidity = await app.request("/v1/mantle/signals/liquidity-delta", { headers });
  const query = await app.request("/v1/query", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ query: "What changed in Mantle liquidity?" })
  });

  for (const response of [me, usage, keys, summary, holders, concentration, liquidity, query]) {
    assert.equal(response.status, 200);
  }

  const summaryPayload = (await summary.json()) as { data: { metadata: { source: string; is_partial: boolean } } };
  assert.equal(summaryPayload.data.metadata.source, "sentinel-demo-provider");
  assert.equal(summaryPayload.data.metadata.is_partial, true);
});

test("API keys can be revoked", async () => {
  const app = createApp({ env: testEnv() });
  const apiKey = await createKey(app);
  const headers = { "x-api-key": apiKey };
  const listResponse = await app.request("/v1/api-keys", { headers });
  const listPayload = (await listResponse.json()) as { keys: Array<{ id: string; status: string }> };
  const keyId = listPayload.keys[0]?.id;

  assert.equal(listResponse.status, 200);
  assert.ok(keyId);

  const revokeResponse = await app.request(`/v1/api-keys/${keyId}`, {
    method: "DELETE",
    headers
  });
  const afterRevoke = await app.request("/v1/me", { headers });

  assert.equal(revokeResponse.status, 200);
  assert.equal(afterRevoke.status, 401);
});

test("rate limit middleware returns honest headers and 429 responses", async () => {
  const app = createApp({ env: testEnv({ RATE_LIMIT_REQUESTS: 1, RATE_LIMIT_COST_UNITS: 10 }) });
  const apiKey = await createKey(app);
  const headers = { "x-api-key": apiKey };

  const first = await app.request("/v1/me", { headers });
  const second = await app.request("/v1/me", { headers });

  assert.equal(first.status, 200);
  assert.equal(first.headers.get("x-ratelimit-limit"), "1");
  assert.equal(first.headers.get("x-ratelimit-remaining"), "0");
  assert.equal(second.status, 429);
  assert.equal(second.headers.has("retry-after"), true);
});
