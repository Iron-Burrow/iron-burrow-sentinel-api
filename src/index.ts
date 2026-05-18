import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { loadEnv } from "./env.js";

const env = loadEnv();
const app = createApp({ env });

serve(
  {
    fetch: app.fetch,
    hostname: "0.0.0.0",
    port: env.PORT
  },
  (info) => {
    console.log(`[sentinel] listening on http://localhost:${info.port}`);
  }
);
