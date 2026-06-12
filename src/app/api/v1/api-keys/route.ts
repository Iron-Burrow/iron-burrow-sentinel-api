import { NextResponse } from "next/server";

import { createApiKey, createOrGetUser, toPublicApiKey } from "@/lib/account";
import { ensureSchema } from "@/lib/db";
import { generateApiKey, getApiKeyPrefix, hashApiKey } from "@/lib/keys";

export const runtime = "nodejs";

function readRequiredString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    body = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    body = {};
  }

  const email = readRequiredString(body, "email");
  const name = readRequiredString(body, "name");
  const keyName = readRequiredString(body, "keyName") ?? "Hackathon key";
  const mode = body.mode === "live" ? "live" : "test";

  if (!email || !email.includes("@") || !name) {
    return NextResponse.json(
      {
        ok: false,
        code: "USER_DETAILS_REQUIRED",
        message: "Provide a valid email and name to create a Sentinel API key.",
      },
      { status: 400 },
    );
  }

  try {
    await ensureSchema();
    const user = await createOrGetUser({ email, name });
    const apiKey = generateApiKey(mode);
    const key = await createApiKey({
      userId: user.id,
      name: keyName,
      keyPrefix: getApiKeyPrefix(apiKey),
      keyHash: hashApiKey(apiKey),
    });

    return NextResponse.json(
      {
        ok: true,
        user,
        key: toPublicApiKey(key),
        api_key: apiKey,
        warning: "This is the only time the full API key will be returned.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api-keys] create failed:", err);
    return NextResponse.json(
      {
        ok: false,
        code: "KEY_CREATE_FAILED",
        message: "Could not create an API key. Check that DATABASE_URL is configured.",
      },
      { status: 500 },
    );
  }
}
