import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";

import { renderApiKeysPage } from "../../views/api-keys.js";
import { renderAssetNotFoundPage, renderCanonicalAssetPage } from "../../views/asset.js";
import { renderDashboardPage } from "../../views/dashboard.js";
import { renderDocsPage } from "../../views/docs.js";
import { renderLandingPage } from "../../views/landing.js";
import { renderMantleAssetErrorPage, renderMantleAssetPage } from "../../views/mantle-asset.js";
import { renderMantleDemoPage } from "../../views/mantle-demo.js";
import { renderSearchResultsPage } from "../../views/search-results.js";
import { renderStatusPage } from "../../views/status.js";
import { renderUsagePage } from "../../views/usage.js";
import {
  findMantleChainMap,
  getIronBurrowAsset,
  listIronBurrowAssets,
  resolveIronBurrow,
  type Currency
} from "../clients/iron-burrow.js";
import {
  findPublicAssetByAddress,
  findPublicAssetBySlug,
  findSimilarPublicAssets,
  resolvePublicAssetSearch
} from "../db/public-assets.js";
import {
  isMantleAddress,
  normalizeMantleAddress,
  type PublicMantleAssetPayload
} from "../public-catalog.js";
import { resolveTokenMediaUrl } from "../media/token-media.js";
import type { AppBindings } from "../types.js";

const publicDir = resolve(fileURLToPath(new URL("../../public", import.meta.url)));
const mediaDir = resolve(fileURLToPath(new URL("../../media", import.meta.url)));
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"]
]);

export function landingPageRoute(c: Context<AppBindings>): Response {
  return c.html(
    renderLandingPage({
      query: c.req.query("q"),
      error: c.req.query("error")
    })
  );
}

export function docsPageRoute(c: Context<AppBindings>): Response {
  return c.html(renderDocsPage());
}

export function dashboardPageRoute(c: Context<AppBindings>): Response {
  return c.html(renderDashboardPage());
}

export function apiKeysPageRoute(c: Context<AppBindings>): Response {
  return c.html(renderApiKeysPage());
}

export function usagePageRoute(c: Context<AppBindings>): Response {
  return c.html(renderUsagePage());
}

export function statusPageRoute(c: Context<AppBindings>): Response {
  return c.html(renderStatusPage());
}

export async function mantleDemoPageRoute(c: Context<AppBindings>): Promise<Response> {
  const assets = await listIronBurrowAssets();
  const error = c.req.query("error") ?? null;
  return c.html(renderMantleDemoPage({ assets, error, currency: readCurrency(c) }));
}

function readCurrency(c: Context<AppBindings>): Currency {
  return getCookie(c, "currency") === "MXN" ? "MXN" : "USD";
}

export function currencyRoute(c: Context<AppBindings>): Response {
  const value = c.req.param("value");
  const currency: Currency = value === "MXN" ? "MXN" : "USD";
  setCookie(c, "currency", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "Lax"
  });
  const back = c.req.header("referer") ?? "/";
  return c.redirect(back);
}

export async function mantleDemoSearchRoute(c: Context<AppBindings>): Promise<Response> {
  const query = (c.req.query("q") ?? "").trim();
  if (!query) {
    return c.redirect("/mantle-demo");
  }

  const hit = await resolveIronBurrow(query);
  if (!hit) {
    const params = new URLSearchParams({ error: `No asset matched "${query}".` });
    return c.redirect(`/mantle-demo?${params.toString()}`);
  }
  return c.redirect(`/mantle/asset/${hit.asset.asset_id}`);
}

export async function mantleDemoChatRoute(c: Context<AppBindings>): Promise<Response> {
  const { chatAi } = c.get("services");

  if (!chatAi.enabled) {
    return c.json(
      { ok: false, error: "Chat is not configured — set GEMINI_API_KEY on the server." },
      503
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return c.json({ ok: false, error: "Message is required." }, 400);
  }
  if (message.length > 1000) {
    return c.json({ ok: false, error: "Message too long (max 1000 chars)." }, 400);
  }

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (turn): turn is { role: "user" | "assistant"; content: string } =>
            typeof turn === "object" &&
            turn !== null &&
            (turn as { role?: unknown }).role !== undefined &&
            ((turn as { role: string }).role === "user" || (turn as { role: string }).role === "assistant") &&
            typeof (turn as { content?: unknown }).content === "string"
        )
        .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 2000) }))
    : [];

  try {
    const assets = await listIronBurrowAssets();
    const reply = await chatAi.ask({ message, history, assets });
    return c.json({ ok: true, answer: reply.answer });
  } catch (err) {
    console.error("[chat] failed:", err);
    return c.json({ ok: false, error: "Chat request failed." }, 500);
  }
}

export async function searchPageRoute(c: Context<AppBindings>): Promise<Response> {
  const query = c.req.query("q") ?? "";
  const result = await resolvePublicAssetSearch(c.get("services").env.DATABASE_URL, query);

  if (result.kind === "empty") {
    return c.redirect("/");
  }

  if (result.kind === "redirect" && result.canonicalPath) {
    return c.redirect(result.canonicalPath);
  }

  if (result.kind === "search_results") {
    return c.html(renderSearchResultsPage({ query, matches: result.matches, message: result.message }));
  }

  const params = new URLSearchParams({
    q: query,
    error: result.message ?? "Search could not resolve that input."
  });
  return c.redirect(`/?${params.toString()}`);
}

export async function publicResolveRoute(c: Context<AppBindings>): Promise<Response> {
  return c.json(await resolvePublicAssetSearch(c.get("services").env.DATABASE_URL, c.req.query("q") ?? ""));
}

export async function publicCanonicalAssetRoute(c: Context<AppBindings>): Promise<Response> {
  const connectionString = c.get("services").env.DATABASE_URL;
  const asset = await findPublicAssetBySlug(connectionString, c.req.param("slug") ?? "");

  if (!asset) {
    return c.json(
      {
        ok: false,
        code: "PUBLIC_ASSET_NOT_FOUND",
        message: "No public Sentinel asset exists for that slug."
      },
      404
    );
  }

  const similarAssets = await findSimilarPublicAssets(connectionString, asset);

  return c.json({
    ok: true,
    asset,
    similar_assets: similarAssets,
    coverage: {
      known_representations: asset.representations.length,
      indexed_representations: asset.representations.filter((representation) => representation.indexedStatus === "partial").length,
      is_partial: true
    }
  });
}

export async function publicMantleAssetRoute(c: Context<AppBindings>): Promise<Response> {
  const address = c.req.param("address") ?? "";

  if (!isMantleAddress(address)) {
    return c.json(
      {
        ok: false,
        code: "INVALID_MANTLE_ADDRESS",
        message: "Address must be a 20-byte EVM address."
      },
      400
    );
  }

  const payload = await buildPublicMantleAssetPayload(c, normalizeMantleAddress(address));
  return c.json({
    ok: true,
    data: payload
  });
}

export async function canonicalAssetPageRoute(c: Context<AppBindings>): Promise<Response> {
  const slug = c.req.param("slug") ?? "";
  const connectionString = c.get("services").env.DATABASE_URL;
  const asset = await findPublicAssetBySlug(connectionString, slug);

  if (!asset) {
    return c.html(renderAssetNotFoundPage(slug), 404);
  }

  const similarAssets = await findSimilarPublicAssets(connectionString, asset);
  return c.html(renderCanonicalAssetPage(asset, similarAssets));
}

export async function mantleAssetPageRoute(c: Context<AppBindings>): Promise<Response> {
  const param = c.req.param("slug") ?? "";

  // Legacy address-based access: keep working so existing /search redirects
  // and JSON tests that hit /mantle/asset/0x... still resolve.
  if (isMantleAddress(param)) {
    const normalizedAddress = normalizeMantleAddress(param);
    const payload = await buildPublicMantleAssetPayload(c, normalizedAddress);
    return c.html(
      renderMantleAssetPage({
        asset: payload.catalogAsset,
        payload,
        hasMantleChainMap: true
      })
    );
  }

  const currency = readCurrency(c);
  const detail = await getIronBurrowAsset(param, { currency });
  if (!detail) {
    return c.html(
      renderMantleAssetErrorPage(`No asset found for "${param}".`),
      param.startsWith("0x") ? 400 : 404
    );
  }

  const mantleMap = findMantleChainMap(detail.chain_maps);
  const mantleAddress = mantleMap?.address ?? deriveDemoAddress(detail.asset.asset_id);
  const payload = await buildPublicMantleAssetPayload(c, normalizeMantleAddress(mantleAddress));

  // Pick the displayed price: latest point from the priceSeries enrichment
  // (the only place upstream emits non-USD prices), fall back to the USD spot
  // when the series is unavailable for this asset.
  const latestSeriesPoint = detail.price_series?.points.at(-1) ?? null;
  const seriesCurrencyMatches =
    latestSeriesPoint != null && detail.price_series?.quoteCurrency === currency;
  const displayPrice = seriesCurrencyMatches ? latestSeriesPoint!.price : detail.price?.price ?? null;
  const displayCurrency: Currency = seriesCurrencyMatches ? currency : "USD";

  payload.summary = {
    ...payload.summary,
    symbol: detail.asset.symbol,
    name: detail.asset.name,
    price_usd: displayPrice,
    price_7d_high: null,
    price_7d_low: null
  };

  return c.html(
    renderMantleAssetPage({
      asset: payload.catalogAsset,
      payload,
      slug: detail.asset.asset_id,
      category: detail.asset.category,
      hasMantleChainMap: mantleMap !== null && mantleMap.address !== null,
      priceMeta: detail.price,
      displayCurrency,
      requestedCurrency: currency,
      seriesPoint: latestSeriesPoint,
      priceSeries: detail.price_series
    })
  );
}

// Stable 20-byte address derived from an asset slug. Used so the synthetic
// Mantle provider returns consistent demo data for assets that have no real
// Mantle chain map.
function deriveDemoAddress(slug: string): string {
  const hex = createHash("sha256").update(`mantle-demo:${slug}`).digest("hex").slice(0, 40);
  return `0x${hex}`;
}

async function buildPublicMantleAssetPayload(
  c: Context<AppBindings>,
  address: string
): Promise<PublicMantleAssetPayload> {
  const provider = c.get("services").mantleProvider;
  const [summary, holders, concentration, catalogAsset] = await Promise.all([
    provider.getAssetSummary(address),
    provider.getAssetHolders(address, { limit: 10 }),
    provider.getAssetConcentration(address),
    findPublicAssetByAddress(c.get("services").env.DATABASE_URL, address).catch(() => null)
  ]);
  const liquidityDelta = await provider.getLiquidityDelta();
  const liquiditySignal = liquidityDelta.signals.find((signal) => signal.asset_address === address) ?? null;

  return {
    chain: "mantle",
    address,
    summary,
    holders,
    concentration,
    catalogAsset,
    logoUrl:
      catalogAsset?.logoUrl ??
      resolveTokenMediaUrl({
        address,
        symbol: summary.symbol,
        name: summary.name
      }),
    liquiditySignal,
    publicBoundary: {
      exposesPrivateRpc: false,
      exposesPrivateIndexers: false,
      exposesInternalGateway: false
    }
  };
}

export async function publicAssetRoute(c: Context<AppBindings>): Promise<Response> {
  return staticAssetRoute(c, publicDir);
}

export async function mediaAssetRoute(c: Context<AppBindings>): Promise<Response> {
  return staticAssetRoute(c, mediaDir);
}

// Whitelisted browser-facing ES modules served straight from node_modules so
// the page can `import` an installed dependency without a bundler. three.module.js
// re-exports from ./three.core.js, so both files must be reachable under /vendor/.
const threeBuildDir = fileURLToPath(new URL("../../node_modules/three/build/", import.meta.url));
const vendorModules = new Map<string, string>([
  ["three.module.js", resolve(threeBuildDir, "three.module.js")],
  ["three.core.js", resolve(threeBuildDir, "three.core.js")]
]);

export async function vendorAssetRoute(c: Context<AppBindings>): Promise<Response> {
  const filePath = vendorModules.get(c.req.param("file") ?? "");

  if (!filePath) {
    return c.notFound();
  }

  try {
    const body = await readFile(filePath);
    return new Response(body, {
      headers: {
        "content-type": "text/javascript; charset=utf-8",
        "cache-control": "public, max-age=86400"
      }
    });
  } catch {
    return c.notFound();
  }
}

async function staticAssetRoute(c: Context<AppBindings>, assetDir: string): Promise<Response> {
  const fileName = c.req.param("file") ?? "";

  if (!/^[a-zA-Z0-9._-]+$/u.test(fileName)) {
    return c.notFound();
  }

  const contentType = contentTypes.get(extname(fileName).toLowerCase());

  if (!contentType) {
    return c.notFound();
  }

  try {
    const body = await readFile(resolve(assetDir, fileName));
    return new Response(body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600"
      }
    });
  } catch {
    return c.notFound();
  }
}
