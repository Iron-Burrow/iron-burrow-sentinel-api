"use client";

import { useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { formatUsd, truncAddr } from "@/lib/format";
import type {
  LiquidityDeltaSignal,
  MantleConcentrationResponse,
  MantleHolder,
  SentinelMetadata,
} from "@/lib/types";

type TabKey = "liquidity" | "concentration" | "accumulation" | "price-range" | "block-changes";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "liquidity", label: "Liquidity" },
  { key: "concentration", label: "Concentration" },
  { key: "accumulation", label: "Accumulation" },
  { key: "price-range", label: "Price range" },
  { key: "block-changes", label: "Block changes" },
];

export interface AssetTabsProps {
  symbol: string;
  liquidityUsd: string;
  priceUsd: string | null;
  price7dHigh: string | null;
  price7dLow: string | null;
  signal: LiquidityDeltaSignal | null;
  metrics: MantleConcentrationResponse["metrics"];
  accumulators: MantleHolder[];
  metadata: SentinelMetadata;
}

export function AssetTabs(props: AssetTabsProps) {
  const [active, setActive] = useState<TabKey>("liquidity");

  return (
    <section className="bs-tabs-section">
      <div className="bs-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`bs-tab${active === tab.key ? " active" : ""}`}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "liquidity" && <LiquidityPanel {...props} />}
      {active === "concentration" && <ConcentrationPanel {...props} />}
      {active === "accumulation" && <AccumulationPanel {...props} />}
      {active === "price-range" && <PriceRangePanel {...props} />}
      {active === "block-changes" && <BlockChangesPanel {...props} />}
    </section>
  );
}

function LiquidityPanel({ symbol, liquidityUsd, signal }: AssetTabsProps) {
  return (
    <div className="bs-tab-panel active">
      <h3 className="bs-question">What changed in asset liquidity?</h3>
      {signal ? (
        <>
          <div className="bs-intel-grid">
            <div className="bs-intel-card">
              <span className="bs-intel-label">24h Delta</span>
              <span
                className={`bs-intel-value ${signal.signal === "inflow" ? "text-positive" : "text-negative"}`}
              >
                {signal.signal === "inflow" ? "+" : ""}${signal.liquidity_delta_usd}
              </span>
            </div>
            <div className="bs-intel-card">
              <span className="bs-intel-label">Change</span>
              <span
                className={`bs-intel-value ${signal.signal === "inflow" ? "text-positive" : "text-negative"}`}
              >
                {signal.signal === "inflow" ? "+" : ""}
                {signal.liquidity_delta_percent}%
              </span>
            </div>
            <div className="bs-intel-card">
              <span className="bs-intel-label">Direction</span>
              <span className="bs-intel-value">
                {signal.signal === "inflow"
                  ? "↑ Inflow"
                  : signal.signal === "outflow"
                    ? "↓ Outflow"
                    : "→ Flat"}
              </span>
            </div>
            <div className="bs-intel-card">
              <span className="bs-intel-label">Current pool</span>
              <span className="bs-intel-value">{formatUsd(liquidityUsd)}</span>
            </div>
          </div>
          <p className="bs-narrative">
            {symbol} saw a <strong>{signal.signal}</strong> of{" "}
            <strong>${signal.liquidity_delta_usd}</strong> ({signal.liquidity_delta_percent}%) in the
            last 24 hours. Confidence: {signal.confidence}.
          </p>
        </>
      ) : (
        <EmptyState
          title="No liquidity signal available."
          detail="Liquidity delta tracking is partial in the demo provider."
        />
      )}
    </div>
  );
}

function ConcentrationPanel({ metrics }: AssetTabsProps) {
  const gini = Number(metrics.gini_estimate);
  const giniLabel = gini > 0.75 ? "high" : gini > 0.6 ? "moderate" : "low";
  const top5Width = Number(metrics.top_5_percent) - Number(metrics.top_1_percent);
  const top10Width = Number(metrics.top_10_percent) - Number(metrics.top_5_percent);

  return (
    <div className="bs-tab-panel active">
      <h3 className="bs-question">Is holder concentration increasing?</h3>
      <div className="bs-intel-grid">
        <div className="bs-intel-card">
          <span className="bs-intel-label">Top 1 holder</span>
          <span className="bs-intel-value">{metrics.top_1_percent}%</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">Top 5 holders</span>
          <span className="bs-intel-value">{metrics.top_5_percent}%</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">Top 10 holders</span>
          <span className="bs-intel-value">{metrics.top_10_percent}%</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">Gini coefficient</span>
          <span className="bs-intel-value">{metrics.gini_estimate}</span>
        </div>
      </div>
      <div className="bs-conc-bar">
        <div className="bs-conc-seg seg-top1" style={{ width: `${metrics.top_1_percent}%` }} />
        <div className="bs-conc-seg seg-top5" style={{ width: `${top5Width}%` }} />
        <div className="bs-conc-seg seg-top10" style={{ width: `${top10Width}%` }} />
      </div>
      <div className="bs-conc-legend">
        <span>
          <span className="bs-legend-dot seg-top1" />
          Top 1
        </span>
        <span>
          <span className="bs-legend-dot seg-top5" />
          Top 5
        </span>
        <span>
          <span className="bs-legend-dot seg-top10" />
          Top 10
        </span>
        <span>
          <span className="bs-legend-dot seg-rest" />
          Others
        </span>
      </div>
      <p className="bs-narrative">
        Top holder controls <strong>{metrics.top_1_percent}%</strong>. Top 10 hold{" "}
        <strong>{metrics.top_10_percent}%</strong>. Gini of{" "}
        <strong>{metrics.gini_estimate}</strong> indicates {giniLabel} concentration.
      </p>
    </div>
  );
}

function AccumulationPanel({ accumulators }: AssetTabsProps) {
  return (
    <div className="bs-tab-panel active">
      <h3 className="bs-question">Which wallets accumulated before volatility?</h3>
      <p className="bs-narrative" style={{ marginBottom: 16 }}>
        Wallets that increased their position by &gt;3% in the past 7 days may signal accumulation
        ahead of price movement.
      </p>
      <div className="bs-table-wrap">
        <table className="bs-table">
          <thead>
            <tr>
              <th>Wallet</th>
              <th>7d Change</th>
              <th>Supply share</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {accumulators.length > 0 ? (
              accumulators.map((h) => (
                <tr key={h.address}>
                  <td className="bs-col-from">
                    <span
                      className="bs-addr-dot"
                      style={{ background: `hsl(${(h.rank * 73) % 360},55%,55%)` }}
                    />
                    <div>
                      <span className="bs-label">{h.label ?? "Unknown wallet"}</span>
                      <span className="mono bs-addr">{truncAddr(h.address)}</span>
                    </div>
                  </td>
                  <td className="text-positive">+{h.change_percent_7d}%</td>
                  <td>{h.percent_supply}% of supply</td>
                  <td>{h.balance_usd ? `$${h.balance_usd}` : "--"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="bs-muted" style={{ textAlign: "center", padding: 24 }}>
                  No wallets with &gt;3% increase detected in the 7-day window.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriceRangePanel({ symbol, priceUsd, price7dHigh, price7dLow }: AssetTabsProps) {
  if (!(priceUsd && price7dHigh && price7dLow)) {
    return (
      <div className="bs-tab-panel active">
        <h3 className="bs-question">Where is the current price relative to its 7-day range?</h3>
        <EmptyState
          title="Price range data not available."
          detail="7-day high/low not tracked for this asset."
        />
      </div>
    );
  }

  const cur = Number(priceUsd);
  const lo = Number(price7dLow);
  const hi = Number(price7dHigh);
  const span = hi - lo;
  const pct = span > 0 ? Math.round(((cur - lo) / span) * 100) : 50;
  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <div className="bs-tab-panel active">
      <h3 className="bs-question">Where is the current price relative to its 7-day range?</h3>
      <div className="bs-intel-grid">
        <div className="bs-intel-card">
          <span className="bs-intel-label">Current price</span>
          <span className="bs-intel-value">${priceUsd}</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">7d Low</span>
          <span className="bs-intel-value">${price7dLow}</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">7d High</span>
          <span className="bs-intel-value">${price7dHigh}</span>
        </div>
      </div>
      <div className="bs-price-range">
        <div className="bs-price-range-track">
          <div className="bs-price-range-fill" style={{ width: `${clamped}%` }} />
          <div className="bs-price-range-dot" style={{ left: `${clamped}%` }} />
        </div>
        <div className="bs-price-range-labels">
          <span>${price7dLow}</span>
          <span className="bs-price-range-pct">{clamped}% of range</span>
          <span>${price7dHigh}</span>
        </div>
      </div>
      <p className="bs-narrative">
        {symbol} is trading at <strong>${priceUsd}</strong> between a 7-day low of ${price7dLow} and
        high of ${price7dHigh}.
      </p>
    </div>
  );
}

function BlockChangesPanel({ metadata }: AssetTabsProps) {
  const block = metadata.indexed_until_block.toLocaleString("en-US");
  return (
    <div className="bs-tab-panel active">
      <h3 className="bs-question">What changed since a specific block?</h3>
      <div className="bs-intel-grid">
        <div className="bs-intel-card">
          <span className="bs-intel-label">Indexed until</span>
          <span className="bs-intel-value mono">#{block}</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">Source</span>
          <span className="bs-intel-value">{metadata.source}</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">Confidence</span>
          <span className="bs-intel-value">{metadata.confidence}</span>
        </div>
        <div className="bs-intel-card">
          <span className="bs-intel-label">Coverage</span>
          <span className="bs-intel-value">{metadata.is_partial ? "Partial" : "Complete"}</span>
        </div>
      </div>
      <p className="bs-narrative">
        All data is indexed up to block <strong>#{block}</strong>. Changes after this block are not
        yet reflected.
      </p>
      {metadata.warnings.length > 0 ? (
        <ul className="bs-warnings">
          {metadata.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
