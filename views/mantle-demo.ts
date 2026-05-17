import type { MantleAssetSummary, MantleConcentrationResponse, LiquidityDeltaResponse } from "../src/providers/mantle-provider.js";
import { escapeHtml, metadataPanel, renderLayout } from "./layout.js";

export function renderMantleDemoPage(input: {
  summary: MantleAssetSummary;
  concentration: MantleConcentrationResponse;
  liquidity: LiquidityDeltaResponse;
}): string {
  const { summary, concentration, liquidity } = input;

  return renderLayout({
    title: "Mantle Demo",
    active: "mantle",
    body: `<section class="page-heading">
      <p class="eyebrow">Mantle demo</p>
      <h1>Source-aware intelligence payloads</h1>
      <p class="lead">These are mock responses shaped like the public Sentinel API. The data is partial by design.</p>
    </section>

    <section class="grid two">
      <article class="panel">
        <h2>${escapeHtml(summary.symbol)} summary</h2>
        <dl class="meta-grid">
          <div><dt>Liquidity</dt><dd>$${escapeHtml(summary.liquidity_usd)}</dd></div>
          <div><dt>Holders</dt><dd>${summary.holder_count.toLocaleString("en-US")}</dd></div>
          <div><dt>Top holder</dt><dd>${escapeHtml(summary.top_holder_percent)}%</dd></div>
          <div><dt>Price</dt><dd>$${escapeHtml(summary.price_usd ?? "unavailable")}</dd></div>
        </dl>
      </article>
      <article class="panel">
        <h2>Concentration</h2>
        <dl class="meta-grid">
          <div><dt>Top 1</dt><dd>${escapeHtml(concentration.metrics.top_1_percent)}%</dd></div>
          <div><dt>Top 5</dt><dd>${escapeHtml(concentration.metrics.top_5_percent)}%</dd></div>
          <div><dt>Top 10</dt><dd>${escapeHtml(concentration.metrics.top_10_percent)}%</dd></div>
          <div><dt>Gini estimate</dt><dd>${escapeHtml(concentration.metrics.gini_estimate)}</dd></div>
        </dl>
      </article>
    </section>

    <section class="panel table-panel">
      <h2>Liquidity delta signals</h2>
      <table>
        <thead><tr><th>Asset</th><th>Window</th><th>Delta USD</th><th>Signal</th><th>Confidence</th></tr></thead>
        <tbody>
          ${liquidity.signals
            .map(
              (signal) => `<tr>
                <td>${escapeHtml(signal.symbol)}</td>
                <td>${escapeHtml(signal.window)}</td>
                <td>${escapeHtml(signal.liquidity_delta_usd)}</td>
                <td>${escapeHtml(signal.signal)}</td>
                <td>${escapeHtml(signal.confidence)}</td>
              </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>

    ${metadataPanel(summary.metadata)}`
  });
}
