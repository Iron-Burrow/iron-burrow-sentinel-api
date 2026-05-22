import assert from "node:assert/strict";
import test from "node:test";

import { createApp } from "../src/app.js";
import { generateApiKey, getApiKeyPrefix, hashApiKey, hashesMatch } from "../src/db/api-keys.js";
import { query } from "../src/db/client.js";
import { resolvePublicAssetSearch } from "../src/db/public-assets.js";
import type { SentinelEnv } from "../src/env.js";
import { resolveTokenMediaUrl } from "../src/media/token-media.js";

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
    PRICE_BACKEND: "disabled",
    PRICE_QL_BASE_URL: "",
    PRICE_QL_INTERNAL_TOKEN: "",
    PRICE_SERVICE_TIMEOUT_MS: 3000,
    PRICE_SERIES_DEFAULT_RANGE: "7d",
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

test("token media resolver maps known public logos only", () => {
  assert.equal(resolveTokenMediaUrl({ symbol: "BTC" }), "/media/bitcoin-btc-logo.png");
  assert.equal(resolveTokenMediaUrl({ name: "Bitcoin" }), "/media/bitcoin-btc-logo.png");
  assert.equal(resolveTokenMediaUrl({ symbol: "ETH" }), "/media/ethereum-eth-logo.png");
  assert.equal(resolveTokenMediaUrl({ name: "Ether" }), "/media/ethereum-eth-logo.png");
  assert.equal(resolveTokenMediaUrl({ name: "Ethereum" }), "/media/ethereum-eth-logo.png");
  assert.equal(resolveTokenMediaUrl({ symbol: "WBTC" }), "/media/wrapped-bitcoin-wbtc-icon.png");
  assert.equal(resolveTokenMediaUrl({ name: "Wrapped Bitcoin" }), "/media/wrapped-bitcoin-wbtc-icon.png");
  assert.equal(resolveTokenMediaUrl({ address: seededWbtcAddress }), "/media/wrapped-bitcoin-wbtc-icon.png");
  assert.equal(resolveTokenMediaUrl({ symbol: "GOLD", name: "Gold" }), null);
  assert.equal(resolveTokenMediaUrl({ symbol: "mETH", name: "Mantle Staked Ether" }), null);
});

test("public UI and status routes boot without private infrastructure details", async () => {
  const app = createApp({ env: testEnv() });

  const landing = await app.request("/");
  const appPage = await app.request("/app");
  const docs = await app.request("/docs");
  const webStatus = await app.request("/status");
  const styles = await app.request("/public/styles.css");
  const script = await app.request("/public/app.js");
  const media = await app.request("/media/bitcoin-btc-logo.png");
  const invalidMediaName = await app.request("/media/../bitcoin-btc-logo.png");
  const invalidMediaType = await app.request("/media/bitcoin-btc-logo.txt");
  const status = await app.request("/v1/status");
  const sources = await app.request("/v1/sources");
  const statusPayload = (await status.json()) as {
    data: {
      public_boundary: {
        exposes_private_rpc: boolean;
        exposes_private_indexers: boolean;
        exposes_internal_gateway: boolean;
      };
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
  assert.equal(media.status, 200);
  assert.match(media.headers.get("content-type") ?? "", /image\/png/u);
  assert.equal(media.headers.get("cache-control"), "public, max-age=3600");
  assert.equal(invalidMediaName.status, 404);
  assert.equal(invalidMediaType.status, 404);
  assert.equal(status.status, 200);
  assert.equal(sources.status, 200);
  assert.equal(statusPayload.data.public_boundary.exposes_private_rpc, false);
  assert.equal(statusPayload.data.public_boundary.exposes_private_indexers, false);
  assert.equal(statusPayload.data.public_boundary.exposes_internal_gateway, false);
});

test("status reports price backend mode without leaking private QL details", async () => {
  const app = createApp({
    env: testEnv({
      PRICE_BACKEND: "service",
      PRICE_QL_BASE_URL: "http://iron-burrow-price-indexer:3010",
      PRICE_QL_INTERNAL_TOKEN: "secret-price-token"
    })
  });

  const response = await app.request("/v1/status");
  const body = await response.text();
  const payload = JSON.parse(body) as { data: { price_backend: { mode: string; configured: boolean } } };

  assert.equal(response.status, 200);
  assert.equal(payload.data.price_backend.mode, "service");
  assert.equal(payload.data.price_backend.configured, true);
  assert.doesNotMatch(body, /iron-burrow-price-indexer/u);
  assert.doesNotMatch(body, /secret-price-token/u);
});

test("public Sentinel search resolves canonical assets and Mantle addresses", async () => {
  const app = createApp({ env: testEnv() });
  const canonical = await app.request("/search?q=mBURROW");
  const btcUpper = await app.request("/search?q=BTC");
  const btcLower = await app.request("/search?q=btc");
  const bitcoinAlias = await app.request("/search?q=bitcoin");
  const ethUpper = await app.request("/search?q=ETH");
  const ethereumAlias = await app.request("/search?q=ethereum");
  const goldUpper = await app.request("/search?q=GOLD");
  const goldLower = await app.request("/search?q=gold");
  const xauAlias = await app.request("/search?q=xau");
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
  assert.equal(btcUpper.headers.get("location"), "/asset/btc");
  assert.equal(btcLower.headers.get("location"), "/asset/btc");
  assert.equal(bitcoinAlias.headers.get("location"), "/asset/btc");
  assert.equal(ethUpper.headers.get("location"), "/asset/eth");
  assert.equal(ethereumAlias.headers.get("location"), "/asset/eth");
  assert.equal(goldUpper.headers.get("location"), "/asset/gold");
  assert.equal(goldLower.headers.get("location"), "/asset/gold");
  assert.equal(xauAlias.headers.get("location"), "/asset/gold");
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
  const btc = await app.request("/asset/btc");
  const eth = await app.request("/asset/eth");
  const gold = await app.request("/asset/gold");
  const wbtc = await app.request("/asset/wbtc");
  const meth = await app.request("/asset/meth");
  const mantle = await app.request("/mantle/asset/0x1111111111111111111111111111111111111111");
  const wbtcMantle = await app.request(`/mantle/asset/${seededWbtcAddress}`);
  const invalid = await app.request("/mantle/asset/not-an-address");

  assert.equal(canonical.status, 200);
  const canonicalHtml = await canonical.text();
  assert.match(canonicalHtml, /Canonical asset/u);
  assert.match(canonicalHtml, /Open Mantle page/u);
  assert.match(canonicalHtml, /No direct node\/RPC\/indexer exposure/u);

  assert.equal(btc.status, 200);
  const btcHtml = await btc.text();
  assert.match(btcHtml, /Bitcoin/u);
  assert.match(btcHtml, /<img class="token-logo" src="\/media\/bitcoin-btc-logo\.png" alt="Bitcoin logo"/u);
  assert.match(btcHtml, /Native asset family/u);
  assert.match(btcHtml, /No public representations are available yet/u);
  assert.match(btcHtml, /WBTC/u);
  assert.match(btcHtml, /Price, holders, and liquidity/u);
  assert.doesNotMatch(btcHtml, /Open Mantle page/u);

  assert.equal(eth.status, 200);
  const ethHtml = await eth.text();
  assert.match(ethHtml, /Ether/u);
  assert.match(ethHtml, /mETH/u);

  assert.equal(gold.status, 200);
  const goldHtml = await gold.text();
  assert.match(goldHtml, /Gold/u);
  assert.match(goldHtml, /token-logo token-badge/u);
  assert.doesNotMatch(goldHtml, /<img class="token-logo" src="\/media\//u);
  assert.match(goldHtml, /Commodity asset family/u);
  assert.match(goldHtml, /No public representations are available yet/u);
  assert.match(goldHtml, /No similar assets are listed yet/u);

  assert.equal(wbtc.status, 200);
  const wbtcHtml = await wbtc.text();
  assert.match(wbtcHtml, /Wrapped Bitcoin/u);
  assert.match(wbtcHtml, /WBTC/u);
  assert.match(wbtcHtml, /\/media\/wrapped-bitcoin-wbtc-icon\.png/u);
  assert.match(wbtcHtml, /Open Mantle page/u);

  assert.equal(meth.status, 200);
  const methHtml = await meth.text();
  assert.match(methHtml, /Similar Assets/u);
  assert.match(methHtml, /ETH/u);
  assert.doesNotMatch(methHtml, /href="\/asset\/meth"/u);

  assert.equal(mantle.status, 200);
  const mantleHtml = await mantle.text();
  assert.match(mantleHtml, /Mantle asset/u);
  assert.match(mantleHtml, /Mock Burrow Signal Token/u);
  assert.match(mantleHtml, /Honest Coverage/u);
  assert.match(mantleHtml, /Demo holder rows/u);

  assert.equal(wbtcMantle.status, 200);
  const wbtcMantleHtml = await wbtcMantle.text();
  assert.match(wbtcMantleHtml, /Wrapped Bitcoin/u);
  assert.match(wbtcMantleHtml, /<img class="token-logo" src="\/media\/wrapped-bitcoin-wbtc-icon\.png" alt="Wrapped Bitcoin logo"/u);
  assert.match(wbtcMantleHtml, /Open canonical asset/u);

  assert.equal(invalid.status, 400);
  assert.match(await invalid.text(), /20-byte EVM address/u);
});

test("public Sentinel UI JSON endpoints expose only curated data", async () => {
  const app = createApp({ env: testEnv() });
  const resolve = await app.request("/api/public/resolve?q=mBURROW");
  const btcResolve = await app.request("/api/public/resolve?q=BTC");
  const goldAliasResolve = await app.request("/api/public/resolve?q=xau");
  const wbtcResolve = await app.request("/api/public/resolve?q=wbtc");
  const btcAsset = await app.request("/api/public/assets/btc");
  const asset = await app.request("/api/public/assets/mburrow");
  const wbtcAsset = await app.request("/api/public/assets/wbtc");
  const methAsset = await app.request("/api/public/assets/meth");
  const mantle = await app.request(`/api/public/mantle/assets/${seededWbtcAddress}`);
  const invalid = await app.request("/api/public/mantle/assets/not-an-address");

  const resolvePayload = (await resolve.json()) as { canonicalPath: string; matches: unknown[] };
  const btcResolvePayload = (await btcResolve.json()) as {
    canonicalPath: string;
    matches: Array<{ logoUrl: string | null }>;
  };
  const goldAliasResolvePayload = (await goldAliasResolve.json()) as {
    canonicalPath: string;
    matches: Array<{ matchKind: string }>;
  };
  const wbtcResolvePayload = (await wbtcResolve.json()) as { canonicalPath: string; matches: unknown[] };
  const btcAssetPayload = (await btcAsset.json()) as {
    ok: boolean;
    asset: { slug: string; assetKind: string; aliases: string[]; logoUrl: string | null; representations: unknown[] };
    similar_assets: Array<{ slug: string; symbol: string; matchKind: string; logoUrl: string | null }>;
  };
  const assetPayload = (await asset.json()) as { ok: boolean; asset: { slug: string } };
  const wbtcAssetPayload = (await wbtcAsset.json()) as {
    ok: boolean;
    asset: { slug: string; name: string; logoUrl: string | null; representations: Array<{ logoUrl: string | null }> };
  };
  const methAssetPayload = (await methAsset.json()) as {
    ok: boolean;
    similar_assets: Array<{ slug: string; symbol: string; name: string; matchKind: string; canonicalPath: string }>;
  };
  const mantlePayload = (await mantle.json()) as {
    ok: boolean;
    data: {
      logoUrl: string | null;
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
  assert.equal(btcResolve.status, 200);
  assert.equal(btcResolvePayload.canonicalPath, "/asset/btc");
  assert.equal(btcResolvePayload.matches[0]?.logoUrl, "/media/bitcoin-btc-logo.png");
  assert.equal(goldAliasResolve.status, 200);
  assert.equal(goldAliasResolvePayload.canonicalPath, "/asset/gold");
  assert.equal(goldAliasResolvePayload.matches[0]?.matchKind, "exact_alias");
  assert.equal(wbtcResolve.status, 200);
  assert.equal(wbtcResolvePayload.canonicalPath, "/asset/wbtc");
  assert.equal(wbtcResolvePayload.matches.length, 1);
  assert.equal(btcAsset.status, 200);
  assert.equal(btcAssetPayload.asset.slug, "btc");
  assert.equal(btcAssetPayload.asset.assetKind, "native");
  assert.equal(btcAssetPayload.asset.logoUrl, "/media/bitcoin-btc-logo.png");
  assert.deepEqual(btcAssetPayload.asset.aliases, ["bitcoin"]);
  assert.equal(btcAssetPayload.asset.representations.length, 0);
  assert.equal(btcAssetPayload.similar_assets.some((similarAsset) => similarAsset.slug === "wbtc"), true);
  assert.equal(
    btcAssetPayload.similar_assets.find((similarAsset) => similarAsset.slug === "wbtc")?.logoUrl,
    "/media/wrapped-bitcoin-wbtc-icon.png"
  );
  assert.equal(asset.status, 200);
  assert.equal(assetPayload.asset.slug, "mburrow");
  assert.equal(wbtcAsset.status, 200);
  assert.equal(wbtcAssetPayload.asset.slug, "wbtc");
  assert.equal(wbtcAssetPayload.asset.name, "Wrapped Bitcoin");
  assert.equal(wbtcAssetPayload.asset.logoUrl, "/media/wrapped-bitcoin-wbtc-icon.png");
  assert.equal(wbtcAssetPayload.asset.representations.length, 1);
  assert.equal(wbtcAssetPayload.asset.representations[0]?.logoUrl, "/media/wrapped-bitcoin-wbtc-icon.png");
  assert.equal(methAsset.status, 200);
  assert.equal(Array.isArray(methAssetPayload.similar_assets), true);
  assert.ok(methAssetPayload.similar_assets.length > 0);
  assert.equal(methAssetPayload.similar_assets.some((similarAsset) => similarAsset.slug === "meth"), false);
  for (const similarAsset of methAssetPayload.similar_assets) {
    assert.equal(typeof similarAsset.slug, "string");
    assert.equal(typeof similarAsset.symbol, "string");
    assert.equal(typeof similarAsset.name, "string");
    assert.equal(typeof similarAsset.matchKind, "string");
    assert.equal(similarAsset.canonicalPath, `/asset/${similarAsset.slug}`);
  }
  assert.equal(mantle.status, 200);
  assert.equal(mantlePayload.data.logoUrl, "/media/wrapped-bitcoin-wbtc-icon.png");
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

test("preferred v1 map exposes contract routes through stable envelopes", async () => {
  const app = createApp({ env: testEnv() });
  const apiKey = await createKey(app);
  const headers = { authorization: `Bearer ${apiKey}` };
  const address = "0x1111111111111111111111111111111111111111";

  const chains = await app.request("/v1/chains");
  const capabilities = await app.request("/v1/capabilities");
  const search = await app.request("/v1/scan/search?q=mBURROW", { headers });
  const token = await app.request(`/v1/tokens/mantle/mainnet/${address}`, { headers });
  const holders = await app.request(`/v1/tokens/mantle/mainnet/${address}/holders?limit=2`, { headers });
  const transferStub = await app.request(`/v1/tokens/mantle/mainnet/${address}/transfers`, { headers });
  const transactionStub = await app.request(
    "/v1/transactions/mantle/mainnet/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    { headers }
  );
  const infra = await app.request("/v1/infra/status", { headers });
  const near = await app.request("/v1/near/validators", { headers });
  const keys = await app.request("/v1/me/api-keys", { headers });
  const limits = await app.request("/v1/me/rate-limits", { headers });
  const signals = await app.request("/v1/signals", { headers });
  const query = await app.request("/v1/sentinel/query", {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ query: "What changed in Mantle liquidity?" })
  });

  assert.equal(chains.status, 200);
  assert.equal(((await chains.json()) as { data: Array<{ chain: string }> }).data[0]?.chain, "mantle");
  assert.equal(capabilities.status, 200);
  assert.equal(((await capabilities.json()) as { data: { token_holders: boolean } }).data.token_holders, true);
  assert.equal(search.status, 200);
  assert.equal(((await search.json()) as { data: { matches: unknown[] }; meta: { partial: boolean } }).meta.partial, true);
  assert.equal(token.status, 200);
  assert.equal(((await token.json()) as { data: { token_address: string }; meta: { chain: string } }).meta.chain, "mantle");
  assert.equal(holders.status, 200);
  assert.equal(((await holders.json()) as { data: { holders: unknown[] } }).data.holders.length, 2);
  assert.equal(transferStub.status, 501);
  assert.equal(((await transferStub.json()) as { error: { code: string } }).error.code, "NOT_INDEXED_YET");
  assert.equal(transactionStub.status, 501);
  assert.equal(((await transactionStub.json()) as { error: { code: string } }).error.code, "NOT_INDEXED_YET");
  assert.equal(infra.status, 200);
  assert.equal(((await infra.json()) as { data: { raw_rpc_public: boolean } }).data.raw_rpc_public, false);
  assert.equal(near.status, 501);
  assert.equal(((await near.json()) as { error: { code: string } }).error.code, "NOT_CONNECTED_YET");
  assert.equal(keys.status, 200);
  assert.ok(((await keys.json()) as { data: { keys: unknown[] } }).data.keys.length > 0);
  assert.equal(limits.status, 200);
  assert.equal(((await limits.json()) as { data: { request_limit: number } }).data.request_limit, 60);
  assert.equal(signals.status, 200);
  assert.ok(((await signals.json()) as { data: unknown[] }).data.length > 0);
  assert.equal(query.status, 200);
  assert.match(((await query.json()) as { data: { answer: string } }).data.answer, /Sentinel demo data/u);
});

test("price routes require API keys", async () => {
  const app = createApp({ env: testEnv() });

  const latest = await app.request("/v1/prices/latest?symbol=BTC");
  const series = await app.request("/v1/prices/series?symbol=BTC");

  assert.equal(latest.status, 401);
  assert.equal(series.status, 401);
});

test("price routes return disabled and misconfigured responses", async () => {
  const disabledApp = createApp({ env: testEnv() });
  const disabledKey = await createKey(disabledApp);
  const disabledResponse = await disabledApp.request("/v1/prices/latest?symbol=BTC", {
    headers: { "x-api-key": disabledKey }
  });
  const disabledPayload = (await disabledResponse.json()) as { code: string; backend: string };

  assert.equal(disabledResponse.status, 503);
  assert.equal((disabledPayload as unknown as { error: { code: string } }).error.code, "PRICE_BACKEND_UNAVAILABLE");

  const misconfiguredApp = createApp({
    env: testEnv({
      PRICE_BACKEND: "service",
      PRICE_QL_BASE_URL: "",
      PRICE_QL_INTERNAL_TOKEN: ""
    })
  });
  const misconfiguredKey = await createKey(misconfiguredApp);
  const misconfiguredResponse = await misconfiguredApp.request("/v1/prices/latest?symbol=BTC", {
    headers: { "x-api-key": misconfiguredKey }
  });
  const misconfiguredPayload = (await misconfiguredResponse.json()) as { code: string };

  assert.equal(misconfiguredResponse.status, 503);
  assert.equal((misconfiguredPayload as unknown as { error: { code: string } }).error.code, "PRICE_BACKEND_UNAVAILABLE");
});

test("price routes forward to the private QL with auth and default series range", async () => {
  const originalFetch = globalThis.fetch;
  const seenUrls: string[] = [];

  globalThis.fetch = async (input, init) => {
    seenUrls.push(String(input));
    assert.equal((init?.headers as Record<string, string>).authorization, "Bearer test-price-token");

    if (String(input).includes("/prices/latest")) {
      return new Response(
        JSON.stringify({
          assetId: "asset_btc",
          symbol: "BTC",
          name: "Bitcoin",
          quoteCurrency: "USD",
          price: "70000",
          sourceType: "coingecko",
          publishedAt: "2026-05-18T00:00:00.000Z",
          recordedAt: "2026-05-18T00:00:05.000Z",
          staleness: {
            ageSeconds: 5,
            isStale: false,
            warningThresholdSeconds: 600
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        assetId: "asset_btc",
        quoteCurrency: "USD",
        range: new URL(String(input)).searchParams.get("range"),
        points: []
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  const app = createApp({
    env: testEnv({
      PRICE_BACKEND: "service",
      PRICE_QL_BASE_URL: "http://prices.example.test",
      PRICE_QL_INTERNAL_TOKEN: "test-price-token",
      PRICE_SERVICE_TIMEOUT_MS: 2500
    })
  });

  try {
    const apiKey = await createKey(app);
    const headers = { "x-api-key": apiKey };
    const assets = await app.request("/v1/prices/assets", { headers });
    const latest = await app.request("/v1/prices/latest?asset=BTC&quote=USD", { headers });
    const defaultSeries = await app.request("/v1/prices/series?symbol=BTC", { headers });
    const explicitSeries = await app.request("/v1/prices/series?symbol=BTC&range=1d", { headers });
    const history = await app.request("/v1/prices/history?asset=BTC&quote=USD", { headers });
    const priceAt = await app.request("/v1/prices/at?asset=BTC&quote=USD&timestamp=2026-05-18T00:00:00.000Z", {
      headers
    });

    assert.equal(assets.status, 200);
    assert.ok(((await assets.json()) as { data: unknown[] }).data.length > 0);
    assert.equal(latest.status, 200);
    assert.equal(latest.headers.get("x-ratelimit-limit"), "60");
    assert.equal(((await latest.json()) as { data: { symbol: string } }).data.symbol, "BTC");
    assert.equal(defaultSeries.status, 200);
    assert.equal(((await defaultSeries.json()) as { range: string }).range, "7d");
    assert.equal(explicitSeries.status, 200);
    assert.equal(((await explicitSeries.json()) as { range: string }).range, "1d");
    assert.equal(history.status, 200);
    assert.equal(((await history.json()) as { data: { range: string } }).data.range, "7d");
    assert.equal(priceAt.status, 501);
    assert.equal(((await priceAt.json()) as { error: { code: string } }).error.code, "NOT_INDEXED_YET");
    assert.deepEqual(seenUrls, [
      "http://prices.example.test/prices/latest?asset=BTC&quote=USD&symbol=BTC",
      "http://prices.example.test/prices/series?symbol=BTC&range=7d",
      "http://prices.example.test/prices/series?symbol=BTC&range=1d",
      "http://prices.example.test/prices/series?asset=BTC&quote=USD&symbol=BTC&range=7d"
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
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
