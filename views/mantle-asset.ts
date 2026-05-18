import type { PublicCanonicalAsset, PublicMantleAssetPayload } from "../src/public-catalog.js";
import { emptyState, escapeHtml, metadataPanel, renderLayout, statusPill } from "./layout.js";

export function renderMantleAssetPage(input: { asset: PublicCanonicalAsset | null; payload: PublicMantleAssetPayload }): string {
  const { payload } = input;
  const summary = payload.summary;
  const canonicalLink = input.asset
    ? `<a class="button secondary" href="/asset/${escapeHtml(input.asset.slug)}">Open canonical asset</a>`
    : `<a class="button secondary" href="/search?q=${encodeURIComponent(payload.address)}">Search this address</a>`;
  const holders =
    payload.holders.holders.length === 0
      ? emptyState("No holder rows are available yet.", "Empty holder lists can be expected while public demo coverage is partial.", "partial")
      : `<div class="table-panel">
        <table>
          <thead><tr><th>Rank</th><th>Holder</th><th>Balance</th><th>Supply</th></tr></thead>
          <tbody>
            ${payload.holders.holders
              .map(
                (holder) => `<tr>
                  <td>${holder.rank}</td>
                  <td>
                    <strong>${escapeHtml(holder.label ?? "Public holder")}</strong>
                    <div class="mono subtle">${escapeHtml(holder.address)}</div>
                  </td>
                  <td>${escapeHtml(holder.balance)}${holder.balance_usd ? `<div class="subtle">$${escapeHtml(holder.balance_usd)}</div>` : ""}</td>
                  <td>${escapeHtml(holder.percent_supply)}%</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

  return renderLayout({
    title: summary.symbol,
    active: "asset",
    body: `<section class="hero asset-hero">
      <div>
        <p class="eyebrow">Mantle asset</p>
        <h1>${escapeHtml(summary.symbol)}</h1>
        <p class="lead">${escapeHtml(summary.name)} on Mantle, rendered from Sentinel's public demo provider with source-aware partial coverage.</p>
        <div class="tag-row">
          <span class="tag mono">${escapeHtml(payload.address)}</span>
          <span class="tag">Hackathon-facing public API</span>
          <span class="tag">No direct node/RPC/indexer exposure</span>
        </div>
        <div class="actions">${canonicalLink}</div>
      </div>
      <div class="signal-board">
        <div><strong>Price</strong><span>${escapeHtml(summary.price_usd ? `$${summary.price_usd}` : "Unavailable")}</span></div>
        <div><strong>Liquidity</strong><span>$${escapeHtml(summary.liquidity_usd)}</span></div>
        <div><strong>Holders</strong><span>${summary.holder_count.toLocaleString("en-US")}</span></div>
        <div><strong>Top holder</strong><span>${escapeHtml(summary.top_holder_percent)}%</span></div>
      </div>
    </section>

    <section class="grid two">
      <article class="panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Concentration</p>
            <h2>Holder distribution</h2>
          </div>
          ${statusPill("Partial", "partial")}
        </div>
        <dl class="meta-grid">
          <div><dt>Top 1</dt><dd>${escapeHtml(payload.concentration.metrics.top_1_percent)}%</dd></div>
          <div><dt>Top 5</dt><dd>${escapeHtml(payload.concentration.metrics.top_5_percent)}%</dd></div>
          <div><dt>Top 10</dt><dd>${escapeHtml(payload.concentration.metrics.top_10_percent)}%</dd></div>
          <div><dt>Gini estimate</dt><dd>${escapeHtml(payload.concentration.metrics.gini_estimate)}</dd></div>
        </dl>
      </article>
      ${metadataPanel(summary.metadata)}
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Public holders</p>
          <h2>Demo holder rows</h2>
        </div>
        ${statusPill("Source-aware responses", "partial")}
      </div>
      ${holders}
    </section>`
  });
}

export function renderMantleAssetErrorPage(message: string): string {
  return renderLayout({
    title: "Mantle asset unavailable",
    active: "asset",
    body: `<section class="page-heading">
      <p class="eyebrow">Mantle asset</p>
      <h1>Sentinel could not render that public asset.</h1>
      <p class="lead">Mantle asset pages only accept 20-byte EVM addresses and return curated public demo data.</p>
    </section>
    ${emptyState("Asset unavailable.", message, "unavailable")}`
  });
}
