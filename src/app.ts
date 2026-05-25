import { Hono } from "hono";
import { cors } from "hono/cors";

import { requireApiKey } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { usageLogMiddleware } from "./middleware/usage-log.js";
import { MockMantleProvider } from "./providers/mock-mantle-provider.js";
import { HttpPriceQlClient } from "./providers/price-ql-client.js";
import { createApiKeyRoute, listApiKeysRoute, revokeApiKeyRoute } from "./routes/api-keys.js";
import { priceAssetsRoute } from "./routes/catalog.js";
import { infraRouteRoute, infraRoutesRoute, infraStatusRoute } from "./routes/infra.js";
import {
  assetConcentrationRoute,
  assetHoldersRoute,
  assetSummaryRoute,
  liquidityDeltaRoute,
  queryRoute,
  sourcesRoute
} from "./routes/mantle.js";
import { meApiKeysRoute, meRateLimitsRoute, meRoute, usageRoute } from "./routes/me.js";
import {
  nearValidatorRoute,
  nearValidatorsRoute,
  nearValidatorSnapshotsRoute,
  nearValidatorStatusRoute
} from "./routes/near.js";
import { latestPriceRoute, priceAtRoute, priceHistoryRoute, priceSeriesRoute } from "./routes/prices.js";
import { scanSearchRoute } from "./routes/scan.js";
import { sentinelQueryRoute, signalRoute, signalsRoute } from "./routes/signals.js";
import { healthRoute, capabilitiesRoute, chainsRoute, networksRoute, statusRoute } from "./routes/status.js";
import {
  addressRoute,
  tokenHoldersRoute,
  tokenRoute,
  tokenTransfersRoute,
  transactionRoute
} from "./routes/tokens.js";
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
  vendorAssetRoute,
  searchPageRoute,
  statusPageRoute,
  usagePageRoute
} from "./routes/web.js";
import type { AppBindings, AppServices } from "./types.js";
import { loadEnv, type SentinelEnv } from "./env.js";
import type { MantleProvider } from "./providers/mantle-provider.js";
import type { PriceQlClient } from "./providers/price-ql-client.js";

export interface CreateAppOptions {
  env?: SentinelEnv;
  mantleProvider?: MantleProvider;
  priceQlClient?: PriceQlClient;
}

export function createApp(options: CreateAppOptions = {}) {
  const env = options.env ?? loadEnv();
  const services: AppServices = {
    env,
    mantleProvider: options.mantleProvider ?? new MockMantleProvider(),
    priceQlClient: options.priceQlClient ?? new HttpPriceQlClient(env)
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
  app.get("/vendor/:file", vendorAssetRoute);
  app.get("/media/:file", mediaAssetRoute);
  app.get("/api/public/resolve", publicResolveRoute);
  app.get("/api/public/assets/:slug", publicCanonicalAssetRoute);
  app.get("/api/public/mantle/assets/:address", publicMantleAssetRoute);

  app.get("/health", healthRoute);
  app.get("/v1/status", statusRoute);
  app.get("/v1/chains", chainsRoute);
  app.get("/v1/networks", networksRoute);
  app.get("/v1/capabilities", capabilitiesRoute);
  app.get("/v1/sources", sourcesRoute);
  app.post("/v1/api-keys", createApiKeyRoute);

  app.get("/v1/scan/search", requireApiKey, rateLimitMiddleware, scanSearchRoute);
  app.get("/v1/addresses/:chain/:network/:address", requireApiKey, rateLimitMiddleware, addressRoute);
  app.get("/v1/tokens/:chain/:network/:token_address/transfers", requireApiKey, rateLimitMiddleware, tokenTransfersRoute);
  app.get("/v1/tokens/:chain/:network/:token_address/holders", requireApiKey, rateLimitMiddleware, tokenHoldersRoute);
  app.get("/v1/tokens/:chain/:network/:token_address", requireApiKey, rateLimitMiddleware, tokenRoute);
  app.get("/v1/transactions/:chain/:network/:tx_hash", requireApiKey, rateLimitMiddleware, transactionRoute);

  app.get("/v1/infra/status", requireApiKey, rateLimitMiddleware, infraStatusRoute);
  app.get("/v1/infra/routes", requireApiKey, rateLimitMiddleware, infraRoutesRoute);
  app.get("/v1/infra/routes/:route_id", requireApiKey, rateLimitMiddleware, infraRouteRoute);

  app.get("/v1/near/validators", requireApiKey, rateLimitMiddleware, nearValidatorsRoute);
  app.get("/v1/near/validators/:account_id/snapshots", requireApiKey, rateLimitMiddleware, nearValidatorSnapshotsRoute);
  app.get("/v1/near/validators/:account_id/status", requireApiKey, rateLimitMiddleware, nearValidatorStatusRoute);
  app.get("/v1/near/validators/:account_id", requireApiKey, rateLimitMiddleware, nearValidatorRoute);

  app.get("/v1/me", requireApiKey, rateLimitMiddleware, meRoute);
  app.get("/v1/me/api-keys", requireApiKey, rateLimitMiddleware, meApiKeysRoute);
  app.get("/v1/me/usage", requireApiKey, rateLimitMiddleware, usageRoute);
  app.get("/v1/me/rate-limits", requireApiKey, rateLimitMiddleware, meRateLimitsRoute);
  app.get("/v1/api-keys", requireApiKey, rateLimitMiddleware, listApiKeysRoute);
  app.delete("/v1/api-keys/:id", requireApiKey, rateLimitMiddleware, revokeApiKeyRoute);
  app.get("/v1/mantle/assets/:address/summary", requireApiKey, rateLimitMiddleware, assetSummaryRoute);
  app.get("/v1/mantle/assets/:address/holders", requireApiKey, rateLimitMiddleware, assetHoldersRoute);
  app.get("/v1/mantle/assets/:address/concentration", requireApiKey, rateLimitMiddleware, assetConcentrationRoute);
  app.get("/v1/mantle/signals/liquidity-delta", requireApiKey, rateLimitMiddleware, liquidityDeltaRoute);
  app.get("/v1/prices/assets", requireApiKey, rateLimitMiddleware, priceAssetsRoute);
  app.get("/v1/prices/latest", requireApiKey, rateLimitMiddleware, latestPriceRoute);
  app.get("/v1/prices/at", requireApiKey, rateLimitMiddleware, priceAtRoute);
  app.get("/v1/prices/series", requireApiKey, rateLimitMiddleware, priceSeriesRoute);
  app.get("/v1/prices/history", requireApiKey, rateLimitMiddleware, priceHistoryRoute);
  app.get("/v1/signals", requireApiKey, rateLimitMiddleware, signalsRoute);
  app.get("/v1/signals/:signal_id", requireApiKey, rateLimitMiddleware, signalRoute);
  app.post("/v1/sentinel/query", requireApiKey, rateLimitMiddleware, sentinelQueryRoute);
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
