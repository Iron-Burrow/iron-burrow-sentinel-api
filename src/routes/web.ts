import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Context } from "hono";

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
  const provider = c.get("services").mantleProvider;
  const featured = [
    "0x4444444444444444444444444444444444444444",
    "0x5555555555555555555555555555555555555555",
    "0x6666666666666666666666666666666666666666"
  ];
  const [assets, liquidity] = await Promise.all([
    Promise.all(featured.map((address) => provider.getAssetSummary(address))),
    provider.getLiquidityDelta()
  ]);

  return c.html(renderMantleDemoPage({ assets, liquidity }));
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
  const address = c.req.param("address") ?? "";

  if (!isMantleAddress(address)) {
    return c.html(renderMantleAssetErrorPage("Address must be a 20-byte EVM address."), 400);
  }

  const normalizedAddress = normalizeMantleAddress(address);
  const payload = await buildPublicMantleAssetPayload(c, normalizedAddress);
  return c.html(
    renderMantleAssetPage({
      asset: payload.catalogAsset,
      payload
    })
  );
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
