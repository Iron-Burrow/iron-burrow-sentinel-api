import { NextResponse, type NextRequest } from "next/server";

import type { Currency } from "@/lib/types";

// Persists the display currency in a cookie and bounces back to the page the
// user came from — mirrors the legacy Hono /currency/:value behaviour.
export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ value: string }> },
) {
  const { value } = await ctx.params;
  const currency: Currency = value === "MXN" ? "MXN" : "USD";

  const referer = request.headers.get("referer");
  const destination = referer ?? new URL("/", request.url).toString();

  const response = NextResponse.redirect(destination);
  response.cookies.set("currency", currency, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  return response;
}
