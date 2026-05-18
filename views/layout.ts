export interface LayoutOptions {
  title: string;
  active?: "home" | "docs" | "dashboard" | "keys" | "usage" | "status" | "mantle" | "asset";
  body: string;
  searchQuery?: string;
  script?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function navLink(href: string, label: string, active: boolean): string {
  return `<a href="${href}"${active ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`;
}

function initials(value: string): string {
  const compact = value.replace(/[^a-zA-Z0-9]/gu, "").toUpperCase();

  if (compact.length === 0) {
    return "IB";
  }

  return compact.slice(0, 3);
}

export function renderTokenIcon(input: {
  logoUrl: string | null;
  symbol: string | null;
  name: string | null;
  className?: string;
}): string {
  const label = input.name ?? input.symbol ?? "Token";
  const className = input.className ?? "token-logo";

  if (input.logoUrl) {
    return `<img class="${escapeHtml(className)}" src="${escapeHtml(input.logoUrl)}" alt="${escapeHtml(label)} logo" loading="lazy" />`;
  }

  return `<span class="${escapeHtml(className)} token-badge" aria-label="${escapeHtml(label)} logo fallback">${escapeHtml(initials(input.symbol ?? label))}</span>`;
}

export function renderAppLogo(): string {
  return `<span class="brand-mark app-logo-wrap">
    <span class="brand-fallback">IB</span>
    <img class="app-logo" src="/media/sentinel-api.png" alt="" aria-hidden="true" onerror="this.remove()" />
  </span>`;
}

export function statusPill(label: string, tone: "healthy" | "partial" | "syncing" | "unavailable" = "partial"): string {
  return `<span class="pill ${tone}">${escapeHtml(label)}</span>`;
}

export function emptyState(title: string, detail: string, tone: "partial" | "unavailable" = "partial"): string {
  return `<div class="empty-state ${tone}">
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(detail)}</p>
  </div>`;
}

export function renderLayout(options: LayoutOptions): string {
  const title = `${options.title} | Iron Burrow Sentinel`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/public/styles.css" />
  </head>
  <body>
    <header class="topbar">
      <a class="brand" href="/" aria-label="Iron Burrow Sentinel home">
        ${renderAppLogo()}
        <span>
          <strong>Iron Burrow Sentinel</strong>
          <small>Public Mantle intelligence</small>
        </span>
      </a>
      <nav aria-label="Primary">
        ${navLink("/", "Home", options.active === "home")}
        ${navLink("/docs", "Docs", options.active === "docs")}
        ${navLink("/app", "Dashboard", options.active === "dashboard")}
        ${navLink("/api-keys", "API Keys", options.active === "keys")}
        ${navLink("/usage", "Usage", options.active === "usage")}
        ${navLink("/status", "Status", options.active === "status")}
        ${navLink("/mantle-demo", "Mantle Demo", options.active === "mantle")}
      </nav>
      <form class="nav-search" action="/search" method="get">
        <input name="q" value="${escapeHtml(options.searchQuery ?? "")}" placeholder="Search mBURROW or 0x..." aria-label="Search Sentinel assets" />
        <button type="submit">Go</button>
      </form>
    </header>
    <main>
      ${options.body}
    </main>
    <script src="/public/app.js" defer></script>
    ${options.script ?? ""}
  </body>
</html>`;
}

export function metadataPanel(metadata: {
  source: string;
  freshness: string;
  indexed_until_block: number;
  confidence: string;
  is_partial: boolean;
  warnings: string[];
}): string {
  return `<section class="panel">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Source metadata</p>
        <h2>Honest Coverage</h2>
      </div>
      <span class="pill">${metadata.is_partial ? "Partial" : "Complete"}</span>
    </div>
    <dl class="meta-grid">
      <div><dt>Source</dt><dd>${escapeHtml(metadata.source)}</dd></div>
      <div><dt>Freshness</dt><dd>${escapeHtml(metadata.freshness)}</dd></div>
      <div><dt>Indexed until</dt><dd>${metadata.indexed_until_block.toLocaleString("en-US")}</dd></div>
      <div><dt>Confidence</dt><dd>${escapeHtml(metadata.confidence)}</dd></div>
    </dl>
    <ul class="warnings">
      ${metadata.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}
    </ul>
  </section>`;
}
