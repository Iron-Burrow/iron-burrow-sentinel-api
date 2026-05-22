import type { PublicCanonicalAsset, PublicMantleAssetPayload } from "../src/public-catalog.js";
import { emptyState, escapeHtml, renderLayout } from "./layout.js";

function formatUsd(value: string): string {
  const num = Number(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

function truncAddr(address: string): string {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function priceRangeBar(current: string, low: string, high: string): string {
  const cur = Number(current);
  const lo = Number(low);
  const hi = Number(high);
  const range = hi - lo;
  const pct = range > 0 ? Math.round(((cur - lo) / range) * 100) : 50;
  const clamped = Math.max(0, Math.min(100, pct));

  return `<div class="bs-price-range">
    <div class="bs-price-range-track">
      <div class="bs-price-range-fill" style="width:${clamped}%"></div>
      <div class="bs-price-range-dot" style="left:${clamped}%"></div>
    </div>
    <div class="bs-price-range-labels">
      <span>$${escapeHtml(low)}</span>
      <span class="bs-price-range-pct">${clamped}% of range</span>
      <span>$${escapeHtml(high)}</span>
    </div>
  </div>`;
}

function signedPercentText(value: string): string {
  const numericValue = Number(value);
  const unsignedValue = value.replace(/^\+/, "");
  const sign = numericValue > 0 ? "+" : "";

  return `${sign}${escapeHtml(unsignedValue)}%`;
}

function signedPercentClass(value: string): string {
  const numericValue = Number(value);

  if (numericValue > 0) return "text-positive";
  if (numericValue < 0) return "text-negative";
  return "";
}

export function renderMantleAssetPage(input: { asset: PublicCanonicalAsset | null; payload: PublicMantleAssetPayload }): string {
  const { payload } = input;
  const s = payload.summary;
  const c = payload.concentration;
  const signal = payload.liquiditySignal;

  const accumulators = payload.holders.holders
    .filter((h) => h.change_percent_7d !== null && Number(h.change_percent_7d) > 3);

  const holderRows = payload.holders.holders
    .map(
      (h) => `<tr>
        <td class="bs-col-from">
          <span class="bs-addr-dot" style="background:hsl(${(h.rank * 73) % 360},55%,55%)"></span>
          <div>
            <span class="bs-label">${escapeHtml(h.label ?? "Unknown wallet")}</span>
            <span class="mono bs-addr">${escapeHtml(truncAddr(h.address))}</span>
          </div>
        </td>
        <td>${escapeHtml(h.percent_supply)}%</td>
        <td>${escapeHtml(h.balance)}${h.balance_usd ? `<div class="bs-usd">$${escapeHtml(h.balance_usd)}</div>` : ""}</td>
        <td>${h.change_percent_7d
          ? `<span class="${signedPercentClass(h.change_percent_7d)}">${signedPercentText(h.change_percent_7d)}</span>`
          : `<span class="bs-muted">--</span>`}</td>
      </tr>`
    )
    .join("");

  const accumulatorRows = accumulators.length > 0
    ? accumulators
        .map(
          (h) => `<tr>
            <td class="bs-col-from">
              <span class="bs-addr-dot" style="background:hsl(${(h.rank * 73) % 360},55%,55%)"></span>
              <div>
                <span class="bs-label">${escapeHtml(h.label ?? "Unknown wallet")}</span>
                <span class="mono bs-addr">${escapeHtml(truncAddr(h.address))}</span>
              </div>
            </td>
            <td class="${signedPercentClass(h.change_percent_7d!)}">${signedPercentText(h.change_percent_7d!)}</td>
            <td>${escapeHtml(h.percent_supply)}% of supply</td>
            <td>${h.balance_usd ? `$${escapeHtml(h.balance_usd)}` : "--"}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="bs-muted" style="text-align:center;padding:24px">No wallets with &gt;3% increase detected in the 7-day window.</td></tr>`;

  return renderLayout({
    title: s.symbol,
    active: "mantle",
    body: `<div class="bs-detail-back">
      <a href="/mantle-demo">&larr; Back to explorer</a>
    </div>

    <section class="bs-token-header">
      <div class="bs-token-title">
        <span class="bs-token-icon">${escapeHtml(s.symbol.slice(0, 2))}</span>
        <h1>${escapeHtml(s.name)} (${escapeHtml(s.symbol)})</h1>
        <span class="bs-badge">ERC-20</span>
        <span class="bs-badge secondary">Mantle L2</span>
        ${signal ? `<span class="bs-badge ${signal.signal === "inflow" ? "positive" : "negative"}">${signal.signal === "inflow" ? "\u2191" : "\u2193"} ${escapeHtml(signal.liquidity_delta_percent)}% 24h</span>` : ""}
      </div>
      <div class="bs-token-contract">
        <span class="mono">${escapeHtml(payload.address)}</span>
      </div>
    </section>

    <section class="bs-stats">
      <div class="bs-stat-row">
        <span class="bs-stat-label">Price</span>
        <span class="bs-stat-value">${escapeHtml(s.price_usd ? `$${s.price_usd}` : "Unavailable")}</span>
      </div>
      <div class="bs-stat-row">
        <span class="bs-stat-label">Liquidity</span>
        <span class="bs-stat-value">${formatUsd(s.liquidity_usd)}</span>
      </div>
      <div class="bs-stat-row">
        <span class="bs-stat-label">Holders</span>
        <span class="bs-stat-value bs-link">${s.holder_count.toLocaleString("en-US")}</span>
      </div>
      <div class="bs-stat-row">
        <span class="bs-stat-label">Top holder</span>
        <span class="bs-stat-value">${escapeHtml(s.top_holder_percent)}%</span>
      </div>
      <div class="bs-stat-row">
        <span class="bs-stat-label">Decimals</span>
        <span class="bs-stat-value">${s.decimals}</span>
      </div>
      <div class="bs-stat-row">
        <span class="bs-stat-label">Indexed until block</span>
        <span class="bs-stat-value mono">#${s.metadata.indexed_until_block.toLocaleString("en-US")}</span>
      </div>
      <div class="bs-stat-row">
        <span class="bs-stat-label">Confidence</span>
        <span class="bs-stat-value">${escapeHtml(s.metadata.confidence)}</span>
      </div>
    </section>

    <section class="bs-tabs-section">
      <div class="bs-tabs" role="tablist" aria-label="Mantle asset intelligence">
        <button id="mantle-tab-liquidity" class="bs-tab active" type="button" data-tab="liquidity" role="tab" aria-selected="true" aria-controls="mantle-panel-liquidity" tabindex="0">Liquidity</button>
        <button id="mantle-tab-concentration" class="bs-tab" type="button" data-tab="concentration" role="tab" aria-selected="false" aria-controls="mantle-panel-concentration" tabindex="-1">Concentration</button>
        <button id="mantle-tab-accumulation" class="bs-tab" type="button" data-tab="accumulation" role="tab" aria-selected="false" aria-controls="mantle-panel-accumulation" tabindex="-1">Accumulation</button>
        <button id="mantle-tab-price-range" class="bs-tab" type="button" data-tab="price-range" role="tab" aria-selected="false" aria-controls="mantle-panel-price-range" tabindex="-1">Price range</button>
        <button id="mantle-tab-block-changes" class="bs-tab" type="button" data-tab="block-changes" role="tab" aria-selected="false" aria-controls="mantle-panel-block-changes" tabindex="-1">Block changes</button>
      </div>

      <!-- Tab 1: What changed in asset liquidity? -->
      <div id="mantle-panel-liquidity" class="bs-tab-panel active" data-panel="liquidity" role="tabpanel" aria-labelledby="mantle-tab-liquidity" tabindex="0">
        <h3 class="bs-question">What changed in asset liquidity?</h3>
        ${signal
          ? `<div class="bs-intel-grid">
              <div class="bs-intel-card">
                <span class="bs-intel-label">24h Delta</span>
                <span class="bs-intel-value ${signal.signal === "inflow" ? "text-positive" : "text-negative"}">${signal.signal === "inflow" ? "+" : ""}$${escapeHtml(signal.liquidity_delta_usd)}</span>
              </div>
              <div class="bs-intel-card">
                <span class="bs-intel-label">Change</span>
                <span class="bs-intel-value ${signal.signal === "inflow" ? "text-positive" : "text-negative"}">${signal.signal === "inflow" ? "+" : ""}${escapeHtml(signal.liquidity_delta_percent)}%</span>
              </div>
              <div class="bs-intel-card">
                <span class="bs-intel-label">Direction</span>
                <span class="bs-intel-value">${signal.signal === "inflow" ? "\u2191 Inflow" : signal.signal === "outflow" ? "\u2193 Outflow" : "\u2192 Flat"}</span>
              </div>
              <div class="bs-intel-card">
                <span class="bs-intel-label">Current pool</span>
                <span class="bs-intel-value">${formatUsd(s.liquidity_usd)}</span>
              </div>
            </div>
            <p class="bs-narrative">${escapeHtml(s.symbol)} saw a <strong>${escapeHtml(signal.signal)}</strong> of <strong>$${escapeHtml(signal.liquidity_delta_usd)}</strong> (${escapeHtml(signal.liquidity_delta_percent)}%) in the last 24 hours. Confidence: ${escapeHtml(signal.confidence)}.</p>`
          : emptyState("No liquidity signal available.", "Liquidity delta tracking is partial in the demo provider.", "partial")}
      </div>

      <!-- Tab 2: Is holder concentration increasing? -->
      <div id="mantle-panel-concentration" class="bs-tab-panel" data-panel="concentration" role="tabpanel" aria-labelledby="mantle-tab-concentration" tabindex="0" hidden>
        <h3 class="bs-question">Is holder concentration increasing?</h3>
        <div class="bs-intel-grid">
          <div class="bs-intel-card">
            <span class="bs-intel-label">Top 1 holder</span>
            <span class="bs-intel-value">${escapeHtml(c.metrics.top_1_percent)}%</span>
          </div>
          <div class="bs-intel-card">
            <span class="bs-intel-label">Top 5 holders</span>
            <span class="bs-intel-value">${escapeHtml(c.metrics.top_5_percent)}%</span>
          </div>
          <div class="bs-intel-card">
            <span class="bs-intel-label">Top 10 holders</span>
            <span class="bs-intel-value">${escapeHtml(c.metrics.top_10_percent)}%</span>
          </div>
          <div class="bs-intel-card">
            <span class="bs-intel-label">Gini coefficient</span>
            <span class="bs-intel-value">${escapeHtml(c.metrics.gini_estimate)}</span>
          </div>
        </div>
        <div class="bs-conc-bar">
          <div class="bs-conc-seg seg-top1" style="width:${escapeHtml(c.metrics.top_1_percent)}%"></div>
          <div class="bs-conc-seg seg-top5" style="width:${Number(c.metrics.top_5_percent) - Number(c.metrics.top_1_percent)}%"></div>
          <div class="bs-conc-seg seg-top10" style="width:${Number(c.metrics.top_10_percent) - Number(c.metrics.top_5_percent)}%"></div>
        </div>
        <div class="bs-conc-legend">
          <span><span class="bs-legend-dot seg-top1"></span>Top 1</span>
          <span><span class="bs-legend-dot seg-top5"></span>Top 5</span>
          <span><span class="bs-legend-dot seg-top10"></span>Top 10</span>
          <span><span class="bs-legend-dot seg-rest"></span>Others</span>
        </div>
        <p class="bs-narrative">Top holder controls <strong>${escapeHtml(c.metrics.top_1_percent)}%</strong>. Top 10 hold <strong>${escapeHtml(c.metrics.top_10_percent)}%</strong>. Gini of <strong>${escapeHtml(c.metrics.gini_estimate)}</strong> indicates ${Number(c.metrics.gini_estimate) > 0.75 ? "high" : Number(c.metrics.gini_estimate) > 0.6 ? "moderate" : "low"} concentration.</p>
      </div>

      <!-- Tab 3: Which wallets accumulated before volatility? -->
      <div id="mantle-panel-accumulation" class="bs-tab-panel" data-panel="accumulation" role="tabpanel" aria-labelledby="mantle-tab-accumulation" tabindex="0" hidden>
        <h3 class="bs-question">Which wallets accumulated before volatility?</h3>
        <p class="bs-narrative" style="margin-bottom:16px">Wallets that increased their position by &gt;3% in the past 7 days may signal accumulation ahead of price movement.</p>
        <div class="bs-table-wrap">
          <table class="bs-table">
            <thead><tr><th>Wallet</th><th>7d Change</th><th>Supply share</th><th>Value</th></tr></thead>
            <tbody>${accumulatorRows}</tbody>
          </table>
        </div>
      </div>

      <!-- Tab 4: Price relative to 7-day range -->
      <div id="mantle-panel-price-range" class="bs-tab-panel" data-panel="price-range" role="tabpanel" aria-labelledby="mantle-tab-price-range" tabindex="0" hidden>
        <h3 class="bs-question">Where is the current price relative to its 7-day range?</h3>
        ${s.price_usd && s.price_7d_high && s.price_7d_low
          ? `<div class="bs-intel-grid">
              <div class="bs-intel-card">
                <span class="bs-intel-label">Current price</span>
                <span class="bs-intel-value">$${escapeHtml(s.price_usd)}</span>
              </div>
              <div class="bs-intel-card">
                <span class="bs-intel-label">7d Low</span>
                <span class="bs-intel-value">$${escapeHtml(s.price_7d_low)}</span>
              </div>
              <div class="bs-intel-card">
                <span class="bs-intel-label">7d High</span>
                <span class="bs-intel-value">$${escapeHtml(s.price_7d_high)}</span>
              </div>
            </div>
            ${priceRangeBar(s.price_usd, s.price_7d_low, s.price_7d_high)}
            <p class="bs-narrative">${escapeHtml(s.symbol)} is trading at <strong>$${escapeHtml(s.price_usd)}</strong> between a 7-day low of $${escapeHtml(s.price_7d_low)} and high of $${escapeHtml(s.price_7d_high)}.</p>`
          : emptyState("Price range data not available.", "7-day high/low not tracked for this asset.", "partial")}
      </div>

      <!-- Tab 5: What changed since a specific block? -->
      <div id="mantle-panel-block-changes" class="bs-tab-panel" data-panel="block-changes" role="tabpanel" aria-labelledby="mantle-tab-block-changes" tabindex="0" hidden>
        <h3 class="bs-question">What changed since a specific block?</h3>
        <div class="bs-intel-grid">
          <div class="bs-intel-card">
            <span class="bs-intel-label">Indexed until</span>
            <span class="bs-intel-value mono">#${s.metadata.indexed_until_block.toLocaleString("en-US")}</span>
          </div>
          <div class="bs-intel-card">
            <span class="bs-intel-label">Source</span>
            <span class="bs-intel-value">${escapeHtml(s.metadata.source)}</span>
          </div>
          <div class="bs-intel-card">
            <span class="bs-intel-label">Confidence</span>
            <span class="bs-intel-value">${escapeHtml(s.metadata.confidence)}</span>
          </div>
          <div class="bs-intel-card">
            <span class="bs-intel-label">Coverage</span>
            <span class="bs-intel-value">${s.metadata.is_partial ? "Partial" : "Complete"}</span>
          </div>
        </div>
        <p class="bs-narrative">All data is indexed up to block <strong>#${s.metadata.indexed_until_block.toLocaleString("en-US")}</strong>. Changes after this block are not yet reflected.</p>
        ${s.metadata.warnings.length > 0
          ? `<ul class="bs-warnings">${s.metadata.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>`
          : ""}
      </div>
    </section>

    <!-- Full holders table -->
    <section class="bs-holders-section">
      <h2>Holders</h2>
      ${payload.holders.holders.length === 0
        ? emptyState("No holder rows available.", "Empty holder lists can be expected while demo coverage is partial.", "partial")
        : `<div class="bs-table-wrap">
            <table class="bs-table">
              <thead><tr><th>Holder</th><th>Supply %</th><th>Balance</th><th>7d Change</th></tr></thead>
              <tbody>${holderRows}</tbody>
            </table>
          </div>`}
    </section>`,
    script: `<script>
      var tabs = Array.prototype.slice.call(document.querySelectorAll('.bs-tab'));
      var panels = Array.prototype.slice.call(document.querySelectorAll('.bs-tab-panel'));

      function activateTab(tab, focusTab) {
        var panelId = tab.getAttribute('aria-controls');

        tabs.forEach(function(t) {
          var isActive = t === tab;
          t.classList.toggle('active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
          t.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        panels.forEach(function(panel) {
          var isActive = panel.id === panelId;
          panel.classList.toggle('active', isActive);
          panel.hidden = !isActive;
        });

        if (focusTab) {
          tab.focus();
        }
      }

      tabs.forEach(function(tab, index) {
        tab.addEventListener('click', function() {
          activateTab(tab, false);
        });

        tab.addEventListener('keydown', function(event) {
          var nextIndex = index;

          if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') nextIndex = 0;
          else if (event.key === 'End') nextIndex = tabs.length - 1;
          else return;

          event.preventDefault();
          activateTab(tabs[nextIndex], true);
        });
      });
    </script>`
  });
}

export function renderMantleAssetErrorPage(message: string): string {
  return renderLayout({
    title: "Mantle asset unavailable",
    active: "mantle",
    body: `<section class="page-heading">
      <p class="eyebrow">Mantle asset</p>
      <h1>Sentinel could not render that public asset.</h1>
      <p class="lead">Mantle asset pages only accept 20-byte EVM addresses and return curated public demo data.</p>
    </section>
    ${emptyState("Asset unavailable.", message, "unavailable")}`
  });
}
