import { NextResponse, type NextRequest } from "next/server";

import { resolveIronBurrow } from "@/lib/iron-burrow";

// Resolves a free-text query against Iron Burrow upstream and bounces to the
// matching Mantle asset page (or back to the explorer with an error).
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (!query) {
    return NextResponse.redirect(new URL("/mantle-demo", request.url));
  }

  const hit = await resolveIronBurrow(query);
  if (!hit) {
    const params = new URLSearchParams({ error: `No asset matched "${query}".` });
    return NextResponse.redirect(new URL(`/mantle-demo?${params.toString()}`, request.url));
  }

  return NextResponse.redirect(new URL(`/mantle/asset/${hit.asset.asset_id}`, request.url));
}
