import type { Metadata } from "next";

import { AssetTabs } from "@/components/mantle/asset-tabs";
import { PriceChart } from "@/components/mantle/price-chart";
import { EmptyState } from "@/components/ui/empty-state";
import {
  findMantleChainMap,
  getIronBurrowAsset,
} from "@/lib/iron-burrow";
import { isMantleAddress, normalizeMantleAddress } from "@/lib/catalog";
import { getCurrency } from "@/lib/currency";
import {
  currencyPrefix,
  formatPrice,
  formatRecordedAt,
  formatUsd,
  truncAddr,
} from "@/lib/format";
import { buildPublicMantleAssetPayload, deriveDemoAddress } from "@/lib/mantle-asset";
import type {
  Currency,
  IronBurrowPrice,
  IronBurrowPricePoint,
  IronBurrowPriceSeries,
  PublicMantleAssetPayload,
} from "@/lib/types";

interface AssetView {
  payload: PublicMantleAssetPayload;
  slug?: string;
  category?: string;
  hasMantleChainMap: boolean;
  priceMeta?: IronBurrowPrice | null;
  displayCurrency: Currency;
  requestedCurrency: Currency;
  seriesPoint?: IronBurrowPricePoint | null;
  priceSeries?: IronBurrowPriceSeries | null;
}

async function resolveView(slug: string): Promise<AssetView | { error: string }> {
  // Legacy address-based access: keep working so existing /search redirects
  // and JSON tests that hit /mantle/asset/0x... still resolve.
  if (isMantleAddress(slug)) {
    const normalizedAddress = normalizeMantleAddress(slug);
    return {
      payload: buildPublicMantleAssetPayload(normalizedAddress),
      hasMantleChainMap: true,
      displayCurrency: "USD",
      requestedCurrency: "USD",
    };
  }

  const currency = await getCurrency();
  const detail = await getIronBurrowAsset(slug, { currency });
  if (!detail) {
    return { error: `No asset found for "${slug}".` };
  }

  const mantleMap = findMantleChainMap(detail.chain_maps);
  const mantleAddress = mantleMap?.address ?? deriveDemoAddress(detail.asset.asset_id);
  const payload = buildPublicMantleAssetPayload(normalizeMantleAddress(mantleAddress));

  // Pick the displayed price: latest point from the priceSeries enrichment
  // (the only place upstream emits non-USD prices), fall back to the USD spot
  // when the series is unavailable for this asset.
  const latestSeriesPoint = detail.price_series?.points.at(-1) ?? null;
  const seriesCurrencyMatches =
    latestSeriesPoint != null && detail.price_series?.quoteCurrency === currency;
  const displayPrice = seriesCurrencyMatches
    ? latestSeriesPoint!.price
    : (detail.price?.price ?? null);
  const displayCurrency: Currency = seriesCurrencyMatches ? currency : "USD";

  payload.summary = {
    ...payload.summary,
    symbol: detail.asset.symbol,
    name: detail.asset.name,
    price_usd: displayPrice,
    price_7d_high: null,
    price_7d_low: null,
  };

  return {
    payload,
    slug: detail.asset.asset_id,
    category: detail.asset.category,
    hasMantleChainMap: mantleMap !== null && mantleMap.address !== null,
    priceMeta: detail.price,
    displayCurrency,
    requestedCurrency: currency,
    seriesPoint: latestSeriesPoint,
    priceSeries: detail.price_series,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const view = await resolveView(slug);
  if ("error" in view) return { title: "Mantle asset unavailable" };
  return { title: view.payload.summary.symbol };
}

export default async function MantleAssetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const view = await resolveView(slug);

  if ("error" in view) {
    return (
      <>
        <section className="page-heading">
          <p className="eyebrow">Mantle asset</p>
          <h1 className="h-title">Sentinel could not render that public asset.</h1>
          <p className="lead">
            Mantle asset pages only accept 20-byte EVM addresses and return curated public demo
            data.
          </p>
        </section>
        <EmptyState title="Asset unavailable." detail={view.error} tone="unavailable" />
      </>
    );
  }

  const {
    payload,
    slug: assetSlug,
    category,
    hasMantleChainMap,
    priceMeta,
    displayCurrency,
    requestedCurrency,
    seriesPoint,
    priceSeries,
  } = view;

  const s = payload.summary;
  const signal = payload.liquiditySignal;
  const hasLivePrice = s.price_usd != null;
  const priceSymbol = currencyPrefix(displayCurrency);
  const mxnRequestedButFallback = requestedCurrency === "MXN" && displayCurrency === "USD";

  const sourceLabel =
    seriesPoint && displayCurrency !== "USD"
      ? `${seriesPoint.sourceType} · ${formatRecordedAt(seriesPoint.sourcePublishedAt)}`
      : priceMeta
        ? `${priceMeta.source_type} · ${formatRecordedAt(priceMeta.recorded_at)}${priceMeta.status === "stale" ? " · stale" : ""}`
        : "";

  const accumulators = payload.holders.holders.filter(
    (h) => h.change_percent_7d !== null && Number(h.change_percent_7d) > 3,
  );

  return (
    <>
      <div className="bs-detail-back">
        <a href="/mantle-demo">← Back to explorer</a>
      </div>

      <div className="bs-header-grid">
        <div className="bs-header-left">
          <section className="bs-token-header">
            <div className="bs-token-title">
              <span className="bs-token-icon">{s.symbol.slice(0, 2)}</span>
              <h1>
                {s.name} ({s.symbol})
              </h1>
              {category ? <span className="bs-badge">{category}</span> : null}
              {hasMantleChainMap ? <span className="bs-badge secondary">Mantle L2</span> : null}
              {signal ? (
                <span className={`bs-badge ${signal.signal === "inflow" ? "positive" : "negative"}`}>
                  {signal.signal === "inflow" ? "↑" : "↓"} {signal.liquidity_delta_percent}% 24h
                </span>
              ) : null}
            </div>
            <div className="bs-token-contract">
              {assetSlug ? <span className="mono">{assetSlug}</span> : null}
              {hasMantleChainMap ? (
                <span className="mono bs-token-contract-addr">{payload.address}</span>
              ) : null}
            </div>
          </section>

          <section className="bs-stats">
            <div className="bs-stat-row">
              <span className="bs-stat-label">Price</span>
              <span className="bs-stat-value">
                {s.price_usd ? `${priceSymbol}${formatPrice(s.price_usd)} ${displayCurrency}` : "Unavailable"}
                {hasLivePrice && sourceLabel ? (
                  <span
                    className="bs-stat-sub"
                    style={{
                      display: "block",
                      fontSize: 11,
                      opacity: 0.6,
                      marginTop: 2,
                      fontWeight: 400,
                    }}
                  >
                    {sourceLabel}
                    {mxnRequestedButFallback ? " · MXN unavailable, showing USD" : ""}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="bs-stat-row">
              <span className="bs-stat-label">Liquidity</span>
              <span className="bs-stat-value">{formatUsd(s.liquidity_usd)}</span>
            </div>
            <div className="bs-stat-row">
              <span className="bs-stat-label">Holders</span>
              <span className="bs-stat-value bs-link">{s.holder_count.toLocaleString("en-US")}</span>
            </div>
            <div className="bs-stat-row">
              <span className="bs-stat-label">Top holder</span>
              <span className="bs-stat-value">{s.top_holder_percent}%</span>
            </div>
            <div className="bs-stat-row">
              <span className="bs-stat-label">Decimals</span>
              <span className="bs-stat-value">{s.decimals}</span>
            </div>
            <div className="bs-stat-row">
              <span className="bs-stat-label">Indexed until block</span>
              <span className="bs-stat-value mono">
                #{s.metadata.indexed_until_block.toLocaleString("en-US")}
              </span>
            </div>
            <div className="bs-stat-row">
              <span className="bs-stat-label">Confidence</span>
              <span className="bs-stat-value">{s.metadata.confidence}</span>
            </div>
          </section>
        </div>

        <section className="bs-price-chart-card">
          <PriceChart series={priceSeries ?? null} currency={displayCurrency} prefix={priceSymbol} />
        </section>
      </div>

      <AssetTabs
        symbol={s.symbol}
        liquidityUsd={s.liquidity_usd}
        priceUsd={s.price_usd}
        price7dHigh={s.price_7d_high}
        price7dLow={s.price_7d_low}
        signal={signal}
        metrics={payload.concentration.metrics}
        accumulators={accumulators}
        metadata={s.metadata}
      />

      <section className="bs-holders-section">
        <h2>Holders</h2>
        {payload.holders.holders.length === 0 ? (
          <EmptyState
            title="No holder rows available."
            detail="Empty holder lists can be expected while demo coverage is partial."
          />
        ) : (
          <div className="bs-table-wrap">
            <table className="bs-table">
              <thead>
                <tr>
                  <th>Holder</th>
                  <th>Supply %</th>
                  <th>Balance</th>
                  <th>7d Change</th>
                </tr>
              </thead>
              <tbody>
                {payload.holders.holders.map((h) => {
                  const change = h.change_percent_7d;
                  const changeNum = change ? Number(change) : 0;
                  return (
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
                      <td>{h.percent_supply}%</td>
                      <td>
                        {h.balance}
                        {h.balance_usd ? <div className="bs-usd">${h.balance_usd}</div> : null}
                      </td>
                      <td>
                        {change ? (
                          <span
                            className={
                              changeNum > 0 ? "text-positive" : changeNum < 0 ? "text-negative" : ""
                            }
                          >
                            {changeNum > 0 ? "+" : ""}
                            {change}%
                          </span>
                        ) : (
                          <span className="bs-muted">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
