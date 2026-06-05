import type {
  Currency,
  IronBurrowPrice,
  IronBurrowPricePoint,
  IronBurrowPriceSeries
} from "../src/clients/iron-burrow.js";
import type { PublicCanonicalAsset, PublicMantleAssetPayload } from "../src/public-catalog.js";
import { emptyState, escapeHtml, renderLayout } from "./layout.js";

function formatPrice(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num >= 1000) return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (num >= 1) return num.toFixed(4);
  return num.toFixed(6);
}

function currencyPrefix(currency: Currency): string {
  return currency === "MXN" ? "MX$" : "$";
}

function formatRecordedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatUsd(value: string): string {
  const num = Number(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

function truncAddr(address: string): string {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function renderPriceChart(
  series: IronBurrowPriceSeries | null,
  currency: Currency,
  symbol: string
): string {
  if (!series || series.points.length < 2) {
    return `<div class="bs-empty-chart" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:280px;padding:32px;text-align:center;color:#666">
      <strong style="margin-bottom:6px">No price history available</strong>
      <p style="font-size:13px;margin:0;opacity:0.7">Iron Burrow priceSeries is temporarily unavailable for this asset.</p>
    </div>`;
  }

  const values = series.points.map((p) => Number(p.price)).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / first) * 100 : 0;
  const positive = delta >= 0;

  // Build SVG path. ViewBox is 100x60 with a 5-unit top/bottom padding.
  const W = 100;
  const H = 60;
  const PAD = 5;
  const range = max - min || 1;
  const xy = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return { x, y };
  });
  const linePath = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  const lineColor = positive ? "#22c55e" : "#ef4444";
  const fillStart = positive ? "rgba(34,197,94,0.30)" : "rgba(239,68,68,0.30)";

  const prefix = symbol;
  const formatTick = (v: number) =>
    v >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 0 }) : v >= 1 ? v.toFixed(2) : v.toFixed(4);
  const firstTs = new Date(series.points[0].bucketStart);
  const lastTs = new Date(series.points[series.points.length - 1].bucketStart);
  const tsLabel = (d: Date) => `${d.getUTCHours().toString().padStart(2, "0")}:00`;

  return `<div style="display:flex;flex-direction:column;width:100%;flex:1;min-width:0;padding:18px 20px;gap:12px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666;font-weight:600">Last ${escapeHtml(series.window)}</div>
        <div style="font-size:22px;font-weight:700;margin-top:4px">${escapeHtml(prefix)}${escapeHtml(formatTick(last))}<span style="font-size:13px;opacity:0.6;margin-left:6px;font-weight:500">${escapeHtml(currency)}</span></div>
      </div>
      <div style="text-align:right">
        <div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:${positive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"};color:${lineColor};font-weight:600;font-size:13px">
          ${positive ? "▲" : "▼"} ${escapeHtml(deltaPct.toFixed(2))}%
        </div>
        <div style="font-size:11px;opacity:0.55;margin-top:4px">${positive ? "+" : ""}${escapeHtml(formatTick(delta))} ${escapeHtml(currency)}</div>
      </div>
    </div>
    <div style="flex:1;position:relative;min-height:180px">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:100%;display:block">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${fillStart}" />
            <stop offset="100%" stop-color="${positive ? "rgba(34,197,94,0)" : "rgba(239,68,68,0)"}" />
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#chart-fill)" />
        <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="0.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
      </svg>
      <div style="position:absolute;top:0;right:0;font-size:10px;opacity:0.5">${escapeHtml(prefix)}${escapeHtml(formatTick(max))}</div>
      <div style="position:absolute;bottom:0;right:0;font-size:10px;opacity:0.5">${escapeHtml(prefix)}${escapeHtml(formatTick(min))}</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;opacity:0.55">
      <span>${escapeHtml(tsLabel(firstTs))} UTC</span>
      <span>${series.points.length} pts · ${escapeHtml(series.granularity)} · ${escapeHtml(series.points[0].sourceType)}</span>
      <span>${escapeHtml(tsLabel(lastTs))} UTC</span>
    </div>
  </div>`;
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

export function renderMantleAssetPage(input: {
  asset: PublicCanonicalAsset | null;
  payload: PublicMantleAssetPayload;
  slug?: string;
  category?: string;
  hasMantleChainMap?: boolean;
  priceMeta?: IronBurrowPrice | null;
  displayCurrency?: Currency;
  requestedCurrency?: Currency;
  seriesPoint?: IronBurrowPricePoint | null;
  priceSeries?: IronBurrowPriceSeries | null;
}): string {
  const {
    payload,
    slug,
    category,
    hasMantleChainMap = false,
    priceMeta,
    displayCurrency = "USD",
    requestedCurrency = "USD",
    seriesPoint,
    priceSeries
  } = input;
  const s = payload.summary;
  const c = payload.concentration;
  const signal = payload.liquiditySignal;
  const hasLivePrice = s.price_usd != null;
  const priceSymbol = currencyPrefix(displayCurrency);
  const mxnRequestedButFallback = requestedCurrency === "MXN" && displayCurrency === "USD";

  // Source line: priceSeries point if we used it, else the spot meta.
  const sourceLabel = seriesPoint && displayCurrency !== "USD"
    ? `${seriesPoint.sourceType} · ${formatRecordedAt(seriesPoint.sourcePublishedAt)}`
    : priceMeta
      ? `${priceMeta.source_type} · ${formatRecordedAt(priceMeta.recorded_at)}${priceMeta.status === "stale" ? " · stale" : ""}`
      : "";
  const priceSourceLine = hasLivePrice && sourceLabel
    ? `<span class="bs-stat-sub" style="display:block;font-size:11px;opacity:0.6;margin-top:2px;font-weight:400">${escapeHtml(sourceLabel)}${mxnRequestedButFallback ? " · MXN unavailable, showing USD" : ""}</span>`
    : "";

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
          ? `<span class="${Number(h.change_percent_7d) > 0 ? "text-positive" : Number(h.change_percent_7d) < 0 ? "text-negative" : ""}">${Number(h.change_percent_7d) > 0 ? "+" : ""}${escapeHtml(h.change_percent_7d)}%</span>`
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
            <td class="text-positive">+${escapeHtml(h.change_percent_7d!)}%</td>
            <td>${escapeHtml(h.percent_supply)}% of supply</td>
            <td>${h.balance_usd ? `$${escapeHtml(h.balance_usd)}` : "--"}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" class="bs-muted" style="text-align:center;padding:24px">No wallets with &gt;3% increase detected in the 7-day window.</td></tr>`;

  return renderLayout({
    title: s.symbol,
    active: "mantle",
    currency: displayCurrency,
    body: `<div class="bs-detail-back">
      <a href="/mantle-demo">&larr; Back to explorer</a>
    </div>

    <div class="bs-header-grid" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:stretch;margin-bottom:36px">
      <div class="bs-header-left" style="display:flex;flex-direction:column;gap:16px">
        <section class="bs-token-header" style="margin:0">
          <div class="bs-token-title">
            <span class="bs-token-icon">${escapeHtml(s.symbol.slice(0, 2))}</span>
            <h1>${escapeHtml(s.name)} (${escapeHtml(s.symbol)})</h1>
            ${category ? `<span class="bs-badge">${escapeHtml(category)}</span>` : ""}
            ${hasMantleChainMap ? `<span class="bs-badge secondary">Mantle L2</span>` : ""}
            ${signal ? `<span class="bs-badge ${signal.signal === "inflow" ? "positive" : "negative"}">${signal.signal === "inflow" ? "\u2191" : "\u2193"} ${escapeHtml(signal.liquidity_delta_percent)}% 24h</span>` : ""}
          </div>
          <div class="bs-token-contract">
            ${slug ? `<span class="mono">${escapeHtml(slug)}</span>` : ""}
            ${hasMantleChainMap ? `<span class="mono bs-token-contract-addr">${escapeHtml(payload.address)}</span>` : ""}
          </div>
        </section>
        <section class="bs-stats" style="margin:0">
          <div class="bs-stat-row">
            <span class="bs-stat-label">Price</span>
            <span class="bs-stat-value">
              ${s.price_usd ? `${priceSymbol}${escapeHtml(formatPrice(s.price_usd))} ${escapeHtml(displayCurrency)}` : "Unavailable"}
              ${priceSourceLine}
            </span>
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
      </div>
      <section class="bs-price-chart-card" style="background:#ffffff;border:1px solid var(--line,#e5e7eb);border-radius:12px;overflow:hidden;display:flex">
        ${renderPriceChart(priceSeries ?? null, displayCurrency, priceSymbol)}
      </section>
    </div>
    <style>
      @media (max-width: 780px) {
        .bs-header-grid { grid-template-columns: 1fr !important; }
      }
    </style>

    <section class="bs-tabs-section">
      <div class="bs-tabs" role="tablist">
        <button class="bs-tab active" data-tab="liquidity" role="tab" aria-selected="true">Liquidity</button>
        <button class="bs-tab" data-tab="concentration" role="tab" aria-selected="false">Concentration</button>
        <button class="bs-tab" data-tab="accumulation" role="tab" aria-selected="false">Accumulation</button>
        <button class="bs-tab" data-tab="price-range" role="tab" aria-selected="false">Price range</button>
        <button class="bs-tab" data-tab="block-changes" role="tab" aria-selected="false">Block changes</button>
      </div>

      <!-- Tab 1: What changed in asset liquidity? -->
      <div class="bs-tab-panel active" data-panel="liquidity">
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
      <div class="bs-tab-panel" data-panel="concentration">
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
      <div class="bs-tab-panel" data-panel="accumulation">
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
      <div class="bs-tab-panel" data-panel="price-range">
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
      <div class="bs-tab-panel" data-panel="block-changes">
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
      document.querySelectorAll('.bs-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          var panel = this.getAttribute('data-tab');
          document.querySelectorAll('.bs-tab').forEach(function(t) { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
          document.querySelectorAll('.bs-tab-panel').forEach(function(p) { p.classList.remove('active'); });
          this.classList.add('active');
          this.setAttribute('aria-selected','true');
          var target = document.querySelector('[data-panel="' + panel + '"]');
          if (target) target.classList.add('active');
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
