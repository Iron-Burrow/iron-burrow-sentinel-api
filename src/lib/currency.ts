import "server-only";

import { cookies } from "next/headers";

import type { Currency } from "./types";

// Display currency is persisted in a cookie, exactly like the legacy Hono app.
export async function getCurrency(): Promise<Currency> {
  const store = await cookies();
  return store.get("currency")?.value === "MXN" ? "MXN" : "USD";
}
