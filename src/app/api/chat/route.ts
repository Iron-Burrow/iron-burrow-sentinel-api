import { NextResponse } from "next/server";

import { askSentinel, isChatEnabled } from "@/lib/chat";
import { listIronBurrowAssets } from "@/lib/iron-burrow";
import type { ChatTurn } from "@/lib/types";

export async function POST(request: Request) {
  if (!isChatEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Chat is not configured — set GEMINI_API_KEY on the server." },
      { status: 503 },
    );
  }

  let body: { message?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ ok: false, error: "Message is required." }, { status: 400 });
  }
  if (message.length > 1000) {
    return NextResponse.json(
      { ok: false, error: "Message too long (max 1000 chars)." },
      { status: 400 },
    );
  }

  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (turn): turn is ChatTurn =>
            typeof turn === "object" &&
            turn !== null &&
            ((turn as { role?: unknown }).role === "user" ||
              (turn as { role?: unknown }).role === "assistant") &&
            typeof (turn as { content?: unknown }).content === "string",
        )
        .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 2000) }))
    : [];

  try {
    const assets = await listIronBurrowAssets();
    const reply = await askSentinel({ message, history, assets });
    return NextResponse.json({ ok: true, answer: reply.answer });
  } catch (err) {
    console.error("[chat] failed:", err);
    return NextResponse.json({ ok: false, error: "Chat request failed." }, { status: 500 });
  }
}
