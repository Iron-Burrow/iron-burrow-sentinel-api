import { Hono } from "hono";
import { cors } from "hono/cors";

import { requireApiKey } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { usageLogMiddleware } from "./middleware/usage-log.js";
import { MockMantleProvider } from "./providers/mock-mantle-provider.js";
import { createApiKeyRoute, listApiKeysRoute, revokeApiKeyRoute } from "./routes/api-keys.js";
import {
  assetConcentrationRoute,
  assetHoldersRoute,
  assetSummaryRoute,
  liquidityDeltaRoute,
  queryRoute,
  sourcesRoute
} from "./routes/mantle.js";
import { meRoute, usageRoute } from "./routes/me.js";
import { healthRoute, statusRoute } from "./routes/status.js";
import {
  apiKeysPageRoute,
  canonicalAssetPageRoute,
  dashboardPageRoute,
  docsPageRoute,
  landingPageRoute,
  mantleAssetPageRoute,
  mantleDemoPageRoute,
  mediaAssetRoute,
  publicCanonicalAssetRoute,
  publicMantleAssetRoute,
  publicResolveRoute,
  publicAssetRoute,
  searchPageRoute,
  statusPageRoute,
  usagePageRoute
} from "./routes/web.js";
import type { AppBindings, AppServices } from "./types.js";
import { loadEnv, type SentinelEnv } from "./env.js";
import type { MantleProvider } from "./providers/mantle-provider.js";

export interface CreateAppOptions {
  env?: SentinelEnv;
  mantleProvider?: MantleProvider;
}

export function createApp(options: CreateAppOptions = {}) {
  const services: AppServices = {
    env: options.env ?? loadEnv(),
    mantleProvider: options.mantleProvider ?? new MockMantleProvider()
  };
  const app = new Hono<AppBindings>();

  app.use(
    "*",
    cors({
      allowHeaders: ["authorization", "content-type", "x-api-key", "x-request-id"],
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      origin: "*"
    })
  );
  app.use("*", async (c, next) => {
    c.set("services", services);
    await next();
  });
  app.use("*", requestIdMiddleware);
  app.use("/v1/*", usageLogMiddleware);

  app.get("/", landingPageRoute);
  app.get("/docs", docsPageRoute);
  app.get("/app", dashboardPageRoute);
  app.get("/search", searchPageRoute);
  app.get("/asset/:slug", canonicalAssetPageRoute);
  app.get("/mantle/asset/:address", mantleAssetPageRoute);
  app.get("/api-keys", apiKeysPageRoute);
  app.get("/usage", usagePageRoute);
  app.get("/status", statusPageRoute);
  app.get("/mantle-demo", mantleDemoPageRoute);
  app.get("/public/:file", publicAssetRoute);
  app.get("/media/:file", mediaAssetRoute);
  app.get("/api/public/resolve", publicResolveRoute);
  app.get("/api/public/assets/:slug", publicCanonicalAssetRoute);
  app.get("/api/public/mantle/assets/:address", publicMantleAssetRoute);

  app.get("/health", healthRoute);
  app.get("/v1/status", statusRoute);
  app.get("/v1/sources", sourcesRoute);
  app.post("/v1/api-keys", createApiKeyRoute);

  app.get("/v1/me", requireApiKey, rateLimitMiddleware, meRoute);
  app.get("/v1/me/usage", requireApiKey, rateLimitMiddleware, usageRoute);
  app.get("/v1/api-keys", requireApiKey, rateLimitMiddleware, listApiKeysRoute);
  app.delete("/v1/api-keys/:id", requireApiKey, rateLimitMiddleware, revokeApiKeyRoute);
  app.get("/v1/mantle/assets/:address/summary", requireApiKey, rateLimitMiddleware, assetSummaryRoute);
  app.get("/v1/mantle/assets/:address/holders", requireApiKey, rateLimitMiddleware, assetHoldersRoute);
  app.get("/v1/mantle/assets/:address/concentration", requireApiKey, rateLimitMiddleware, assetConcentrationRoute);
  app.get("/v1/mantle/signals/liquidity-delta", requireApiKey, rateLimitMiddleware, liquidityDeltaRoute);
  app.post("/v1/query", requireApiKey, rateLimitMiddleware, queryRoute);

  app.notFound((c) =>
    c.json(
      {
        ok: false,
        code: "NOT_FOUND",
        message: "No Sentinel route exists for this path."
      },
      404
    )
  );

  app.onError((error, c) => {
    console.error("[sentinel] request failed", error);
    return c.json(
      {
        ok: false,
        code: "INTERNAL_SERVER_ERROR",
        message: services.env.NODE_ENV === "production" ? "Unexpected server error." : error.message
      },
      500
    );
  });

  return app;
}
