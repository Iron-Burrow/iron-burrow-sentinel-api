import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { Context } from "hono";

import { renderApiKeysPage } from "../../views/api-keys.js";
import { renderDashboardPage } from "../../views/dashboard.js";
import { renderDocsPage } from "../../views/docs.js";
import { renderLandingPage } from "../../views/landing.js";
import { renderMantleDemoPage } from "../../views/mantle-demo.js";
import { renderStatusPage } from "../../views/status.js";
import { renderUsagePage } from "../../views/usage.js";
import type { AppBindings } from "../types.js";

const publicDir = resolve(fileURLToPath(new URL("../../public", import.meta.url)));
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
  return c.html(renderLandingPage());
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
  const address = "0x1111111111111111111111111111111111111111";
  const [summary, concentration, liquidity] = await Promise.all([
    provider.getAssetSummary(address),
    provider.getAssetConcentration(address),
    provider.getLiquidityDelta()
  ]);

  return c.html(renderMantleDemoPage({ summary, concentration, liquidity }));
}

export async function publicAssetRoute(c: Context<AppBindings>): Promise<Response> {
  const fileName = c.req.param("file");

  if (!/^[a-zA-Z0-9._-]+$/u.test(fileName)) {
    return c.notFound();
  }

  const contentType = contentTypes.get(extname(fileName).toLowerCase());

  if (!contentType) {
    return c.notFound();
  }

  try {
    const body = await readFile(resolve(publicDir, fileName));
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
