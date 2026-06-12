import { NextResponse } from "next/server";

import { authenticateRequest, getUsageSummary, listApiKeys } from "@/lib/account";
import { ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const auth = await authenticateRequest(request.headers);
    if (!auth) {
      return NextResponse.json(
        { ok: false, code: "API_KEY_REQUIRED", message: "API key required." },
        { status: 401 },
      );
    }

    const [usage, keys] = await Promise.all([
      getUsageSummary(auth.user.id),
      listApiKeys(auth.user.id),
    ]);

    return NextResponse.json({ ok: true, user: auth.user, usage, keys });
  } catch (err) {
    console.error("[usage] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        code: "USAGE_FAILED",
        message: "Could not load usage. Check that DATABASE_URL is configured.",
      },
      { status: 500 },
    );
  }
}
