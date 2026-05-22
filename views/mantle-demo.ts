import type { MantleAssetSummary, LiquidityDeltaResponse } from "../src/providers/mantle-provider.js";
import { escapeHtml, renderLayout } from "./layout.js";

export function renderMantleDemoPage(input: {
  assets: MantleAssetSummary[];
  liquidity: LiquidityDeltaResponse;
}): string {
  const { assets } = input;

  const assetTags = assets
    .map(
      (a) =>
        `<a class="bs-asset-tag" href="/mantle/asset/${escapeHtml(a.address)}">
          <span class="bs-asset-tag-icon">${escapeHtml(a.symbol.slice(0, 2))}</span>
          <span>${escapeHtml(a.symbol)}</span>
        </a>`
    )
    .join("");

  const categoryTags = ["Address", "Token", "Holder", "Liquidity", "Concentration", "Block"]
    .map((t) => `<span class="bs-cat-tag">${t}</span>`)
    .join("");

  return renderLayout({
    title: "Mantle Explorer",
    active: "mantle",
    body: `<section class="bs-hero">
      <h1 class="bs-title">Mantle intelligence<br/><span class="bs-title-accent">Expand your exploration</span></h1>
      <div class="bs-hero-actions">
        <a class="bs-action-btn primary" href="#search">Search on chain</a>
        <a class="bs-action-btn" href="/docs">Explore API</a>
      </div>
      <form class="bs-search" action="/search" method="get" id="search">
        <span class="bs-search-icon">&#x1F50D;</span>
        <input name="q" placeholder="Search by address / token / symbol..." aria-label="Search Mantle assets" autocomplete="off" />
      </form>
      <div class="bs-cat-tags">
        <span class="bs-cat-label">Try searching by:</span>
        ${categoryTags}
      </div>
    </section>

    <section class="bs-featured">
      <h2 class="bs-section-title">Featured assets</h2>
      <p class="bs-section-sub">Select a token to investigate intelligence signals</p>
      <div class="bs-asset-tags">${assetTags}</div>
    </section>`
  });
}
