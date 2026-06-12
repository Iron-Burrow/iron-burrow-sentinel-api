import "server-only";

import { GoogleGenerativeAI, type Content } from "@google/generative-ai";

import type { ChatTurn, IronBurrowAsset } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT_PREAMBLE = `You are the Iron Burrow Sentinel assistant — an on-chain intelligence helper for the Mantle Explorer demo.

Your job:
- Answer concise (2-4 sentence) questions about the assets in the Iron Burrow catalog.
- When the user references an asset by symbol or name, point them at /mantle/asset/{asset_id} so they can drill in.
- For specific numeric questions (price, holders, liquidity, 24h flows), tell the user to open that asset's page — you don't have live numbers for individual assets, only the catalog list.
- If asked something outside the catalog (general crypto news, macro, opinions, anything not related to these 20 assets), politely redirect.

Style: direct, factual, no preamble like "Sure!" or "Great question". Plain text only — no markdown headers or code blocks.`;

export function isChatEnabled(): boolean {
  return GEMINI_API_KEY.length > 0;
}

function buildSystemInstruction(assets: IronBurrowAsset[]): string {
  const catalog = assets
    .map((a) => `- ${a.symbol} — ${a.name} (asset_id: ${a.asset_id}, category: ${a.category})`)
    .join("\n");
  return `${SYSTEM_PROMPT_PREAMBLE}\n\nCatalog (${assets.length} assets):\n${catalog}`;
}

function toGeminiHistory(history: ChatTurn[]): Content[] {
  // Gemini uses "user" / "model" roles. Skip a leading assistant turn — Gemini
  // requires the first history entry (if any) to be from "user".
  const trimmed = [...history];
  while (trimmed.length > 0 && trimmed[0].role === "assistant") {
    trimmed.shift();
  }
  return trimmed.slice(-10).map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));
}

export async function askSentinel(input: {
  message: string;
  history: ChatTurn[];
  assets: IronBurrowAsset[];
}): Promise<{ answer: string }> {
  if (!GEMINI_API_KEY) {
    throw new Error("Chat client not configured.");
  }

  const client = new GoogleGenerativeAI(GEMINI_API_KEY);
  const generative = client.getGenerativeModel({
    model: GEMINI_CHAT_MODEL,
    systemInstruction: buildSystemInstruction(input.assets),
  });

  const chat = generative.startChat({
    history: toGeminiHistory(input.history),
    generationConfig: { maxOutputTokens: 512, temperature: 0.4 },
  });

  const result = await chat.sendMessage(input.message);
  const answer = result.response.text().trim();
  return { answer: answer || "Sorry, I couldn't generate a response." };
}
