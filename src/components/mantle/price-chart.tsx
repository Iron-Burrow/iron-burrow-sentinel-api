import type { Currency, IronBurrowPriceSeries } from "@/lib/types";

function formatTick(v: number): string {
  return v >= 1000
    ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : v >= 1
      ? v.toFixed(2)
      : v.toFixed(4);
}

function tsLabel(d: Date): string {
  return `${d.getUTCHours().toString().padStart(2, "0")}:00`;
}

// `prefix` is the currency symbol ("$" / "MX$") shown ahead of values.
export function PriceChart({
  series,
  currency,
  prefix,
}: {
  series: IronBurrowPriceSeries | null;
  currency: Currency;
  prefix: string;
}) {
  if (!series || series.points.length < 2) {
    return (
      <div
        className="bs-empty-chart"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 280,
          padding: 32,
          textAlign: "center",
          color: "#666",
        }}
      >
        <strong style={{ marginBottom: 6 }}>No price history available</strong>
        <p style={{ fontSize: 13, margin: 0, opacity: 0.7 }}>
          Iron Burrow priceSeries is temporarily unavailable for this asset.
        </p>
      </div>
    );
  }

  const values = series.points.map((p) => Number(p.price)).filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;
  const deltaPct = first !== 0 ? (delta / first) * 100 : 0;
  const positive = delta >= 0;

  const W = 100;
  const H = 60;
  const PAD = 5;
  const range = max - min || 1;
  const xy = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return { x, y };
  });
  const linePath = xy
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;

  const lineColor = positive ? "#22c55e" : "#ef4444";
  const fillStart = positive ? "rgba(34,197,94,0.30)" : "rgba(239,68,68,0.30)";
  const fillEnd = positive ? "rgba(34,197,94,0)" : "rgba(239,68,68,0)";

  const firstTs = new Date(series.points[0].bucketStart);
  const lastTs = new Date(series.points[series.points.length - 1].bucketStart);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flex: 1,
        minWidth: 0,
        padding: "18px 20px",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#666",
              fontWeight: 600,
            }}
          >
            Last {series.window}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
            {prefix}
            {formatTick(last)}
            <span style={{ fontSize: 13, opacity: 0.6, marginLeft: 6, fontWeight: 500 }}>
              {currency}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 999,
              background: positive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: lineColor,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            {positive ? "▲" : "▼"} {deltaPct.toFixed(2)}%
          </div>
          <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>
            {positive ? "+" : ""}
            {formatTick(delta)} {currency}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", minHeight: 180 }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillStart} />
              <stop offset="100%" stopColor={fillEnd} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#chart-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth={0.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div style={{ position: "absolute", top: 0, right: 0, fontSize: 10, opacity: 0.5 }}>
          {prefix}
          {formatTick(max)}
        </div>
        <div style={{ position: "absolute", bottom: 0, right: 0, fontSize: 10, opacity: 0.5 }}>
          {prefix}
          {formatTick(min)}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.55 }}>
        <span>{tsLabel(firstTs)} UTC</span>
        <span>
          {series.points.length} pts · {series.granularity} · {series.points[0].sourceType}
        </span>
        <span>{tsLabel(lastTs)} UTC</span>
      </div>
    </div>
  );
}
