import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../src/app.js";
import { generateApiKey, getApiKeyPrefix, hashApiKey, hashesMatch } from "../src/db/api-keys.js";
import { query } from "../src/db/client.js";
import { resolvePublicAssetSearch } from "../src/db/public-assets.js";
import type { SentinelEnv } from "../src/env.js";

const seededWbtcAddress = "0x3333333333333333333333333333333333333333";

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
  const appPage = await app.request("/app");
  const docs = await app.request("/docs");
  const webStatus = await app.request("/status");
  const styles = await app.request("/public/styles.css");
  const script = await app.request("/public/app.js");
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
  const landingHtml = await landing.text();
  assert.match(landingHtml, /Iron Burrow Sentinel/u);
  assert.match(landingHtml, /Search a canonical asset or Mantle address/u);
  assert.equal(appPage.status, 200);
  assert.equal(docs.status, 200);
  assert.equal(webStatus.status, 200);
  assert.equal(styles.status, 200);
  assert.match(styles.headers.get("content-type") ?? "", /text\/css/u);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type") ?? "", /javascript/u);
  assert.equal(status.status, 200);
  assert.equal(sources.status, 200);
  assert.equal(statusPayload.public_boundary.exposes_private_rpc, false);
  assert.equal(statusPayload.public_boundary.exposes_private_indexers, false);
  assert.equal(statusPayload.public_boundary.exposes_internal_gateway, false);
});

test("public Sentinel search resolves canonical assets and Mantle addresses", async () => {
  const app = createApp({ env: testEnv() });
  const canonical = await app.request("/search?q=mBURROW");
  const wbtcSlug = await app.request("/search?q=wbtc");
  const wbtcSymbol = await app.request("/search?q=WBTC");
  const wbtcName = await app.request("/search?q=Wrapped%20Bitcoin");
  const address = "0x1111111111111111111111111111111111111111";
  const chainAsset = await app.request(`/search?q=${address}`);
  const wbtcChainAsset = await app.request(`/search?q=${seededWbtcAddress}`);
  const broad = await app.request("/search?q=m");
  const unknown = await app.request("/search?q=not-a-sentinel-asset");

  assert.equal(canonical.status, 302);
  assert.equal(canonical.headers.get("location"), "/asset/mburrow");
  assert.equal(wbtcSlug.status, 302);
  assert.equal(wbtcSlug.headers.get("location"), "/asset/wbtc");
  assert.equal(wbtcSymbol.status, 302);
  assert.equal(wbtcSymbol.headers.get("location"), "/asset/wbtc");
  assert.equal(wbtcName.status, 302);
  assert.equal(wbtcName.headers.get("location"), "/asset/wbtc");
  assert.equal(chainAsset.status, 302);
  assert.equal(chainAsset.headers.get("location"), `/mantle/asset/${address}`);
  assert.equal(wbtcChainAsset.status, 302);
  assert.equal(wbtcChainAsset.headers.get("location"), `/mantle/asset/${seededWbtcAddress}`);
  assert.equal(broad.status, 200);
  const broadHtml = await broad.text();
  assert.match(broadHtml, /mBURROW/u);
  assert.match(broadHtml, /mDEMO/u);
  assert.match(broadHtml, /mETH/u);
  assert.match(broadHtml, /MNT/u);
  assert.equal(unknown.status, 302);
  assert.match(unknown.headers.get("location") ?? "", /Search\+could\+not|not\+resolve|not-a-sentinel-asset/u);
});

test("public Sentinel asset pages render source-aware safe UI", async () => {
  const app = createApp({ env: testEnv() });
  const canonical = await app.request("/asset/mburrow");
  const wbtc = await app.request("/asset/wbtc");
  const mantle = await app.request("/mantle/asset/0x1111111111111111111111111111111111111111");
  const wbtcMantle = await app.request(`/mantle/asset/${seededWbtcAddress}`);
  const invalid = await app.request("/mantle/asset/not-an-address");

  assert.equal(canonical.status, 200);
  const canonicalHtml = await canonical.text();
  assert.match(canonicalHtml, /Canonical asset/u);
  assert.match(canonicalHtml, /Open Mantle page/u);
  assert.match(canonicalHtml, /No direct node\/RPC\/indexer exposure/u);

  assert.equal(wbtc.status, 200);
  const wbtcHtml = await wbtc.text();
  assert.match(wbtcHtml, /Wrapped Bitcoin/u);
  assert.match(wbtcHtml, /WBTC/u);
  assert.match(wbtcHtml, /Open Mantle page/u);

  assert.equal(mantle.status, 200);
  const mantleHtml = await mantle.text();
  assert.match(mantleHtml, /Mantle asset/u);
  assert.match(mantleHtml, /Mock Burrow Signal Token/u);
  assert.match(mantleHtml, /Honest Coverage/u);
  assert.match(mantleHtml, /Demo holder rows/u);

  assert.equal(wbtcMantle.status, 200);
  const wbtcMantleHtml = await wbtcMantle.text();
  assert.match(wbtcMantleHtml, /Wrapped Bitcoin/u);
  assert.match(wbtcMantleHtml, /Open canonical asset/u);

  assert.equal(invalid.status, 400);
  assert.match(await invalid.text(), /20-byte EVM address/u);
});

test("public Sentinel UI JSON endpoints expose only curated data", async () => {
  const app = createApp({ env: testEnv() });
  const resolve = await app.request("/api/public/resolve?q=mBURROW");
  const wbtcResolve = await app.request("/api/public/resolve?q=wbtc");
  const asset = await app.request("/api/public/assets/mburrow");
  const wbtcAsset = await app.request("/api/public/assets/wbtc");
  const mantle = await app.request(`/api/public/mantle/assets/${seededWbtcAddress}`);
  const invalid = await app.request("/api/public/mantle/assets/not-an-address");

  const resolvePayload = (await resolve.json()) as { canonicalPath: string; matches: unknown[] };
  const wbtcResolvePayload = (await wbtcResolve.json()) as { canonicalPath: string; matches: unknown[] };
  const assetPayload = (await asset.json()) as { ok: boolean; asset: { slug: string } };
  const wbtcAssetPayload = (await wbtcAsset.json()) as {
    ok: boolean;
    asset: { slug: string; name: string; representations: unknown[] };
  };
  const mantlePayload = (await mantle.json()) as {
    ok: boolean;
    data: {
      catalogAsset: { slug: string } | null;
      publicBoundary: {
        exposesPrivateRpc: boolean;
        exposesPrivateIndexers: boolean;
        exposesInternalGateway: boolean;
      };
    };
  };

  assert.equal(resolve.status, 200);
  assert.equal(resolvePayload.canonicalPath, "/asset/mburrow");
  assert.equal(resolvePayload.matches.length, 1);
  assert.equal(wbtcResolve.status, 200);
  assert.equal(wbtcResolvePayload.canonicalPath, "/asset/wbtc");
  assert.equal(wbtcResolvePayload.matches.length, 1);
  assert.equal(asset.status, 200);
  assert.equal(assetPayload.asset.slug, "mburrow");
  assert.equal(wbtcAsset.status, 200);
  assert.equal(wbtcAssetPayload.asset.slug, "wbtc");
  assert.equal(wbtcAssetPayload.asset.name, "Wrapped Bitcoin");
  assert.equal(wbtcAssetPayload.asset.representations.length, 1);
  assert.equal(mantle.status, 200);
  assert.equal(mantlePayload.data.catalogAsset?.slug, "wbtc");
  assert.equal(mantlePayload.data.publicBoundary.exposesPrivateRpc, false);
  assert.equal(mantlePayload.data.publicBoundary.exposesPrivateIndexers, false);
  assert.equal(mantlePayload.data.publicBoundary.exposesInternalGateway, false);
  assert.equal(invalid.status, 400);
});

test("public asset DB resolver handles matching and excludes inactive rows", async () => {
  const env = testEnv();

  await query(
    env.DATABASE_URL,
    `
    insert into public_assets (slug, symbol, name, description, tags, is_active)
    values
      (
        'inactive-search-fixture',
        'GHOST',
        'Inactive Search Fixture',
        'Fixture that must not appear in public search.',
        array['test'],
        false
      ),
      (
        'symbol-search-fixture',
        'SYMLOOKUP',
        'Symbol Search Fixture',
        'Fixture for exact symbol resolver coverage.',
        array['test'],
        true
      )
    on conflict (slug) do update
    set
      symbol = excluded.symbol,
      name = excluded.name,
      description = excluded.description,
      tags = excluded.tags,
      is_active = excluded.is_active,
      updated_at = now()
    `
  );

  const bySlug = await resolvePublicAssetSearch(env.DATABASE_URL, "wbtc");
  const bySymbol = await resolvePublicAssetSearch(env.DATABASE_URL, "SYMLOOKUP");
  const byName = await resolvePublicAssetSearch(env.DATABASE_URL, "Wrapped Bitcoin");
  const byAddress = await resolvePublicAssetSearch(env.DATABASE_URL, `  ${seededWbtcAddress}  `);
  const inactive = await resolvePublicAssetSearch(env.DATABASE_URL, "GHOST");

  assert.equal(bySlug.canonicalPath, "/asset/wbtc");
  assert.equal(bySlug.matches[0]?.matchKind, "exact_slug");
  assert.equal(bySymbol.canonicalPath, "/asset/symbol-search-fixture");
  assert.equal(bySymbol.matches[0]?.matchKind, "exact_symbol");
  assert.equal(byName.canonicalPath, "/asset/wbtc");
  assert.equal(byName.matches[0]?.matchKind, "exact_name");
  assert.equal(byAddress.canonicalPath, `/mantle/asset/${seededWbtcAddress}`);
  assert.equal(byAddress.normalizedQuery, seededWbtcAddress);
  assert.equal(inactive.kind, "unknown");
});

test("mother API private dashboard routes are not exposed by Sentinel", async () => {
  const app = createApp({ env: testEnv() });

  for (const path of ["/admin", "/api/internal/admin/tables", "/login", "/sepolia/token/0x1111111111111111111111111111111111111111"]) {
    const response = await app.request(path);
    assert.equal(response.status, 404, path);
  }
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
