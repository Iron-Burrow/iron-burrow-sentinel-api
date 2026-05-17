export interface LayoutOptions {
  title: string;
  active?: "home" | "docs" | "dashboard" | "keys" | "usage" | "status" | "mantle";
  body: string;
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
        <span class="brand-mark">IB</span>
        <span>
          <strong>Iron Burrow Sentinel</strong>
          <small>Public Mantle intelligence</small>
        </span>
      </a>
      <nav aria-label="Primary">
        ${navLink("/docs", "Docs", options.active === "docs")}
        ${navLink("/app", "Dashboard", options.active === "dashboard")}
        ${navLink("/api-keys", "API Keys", options.active === "keys")}
        ${navLink("/usage", "Usage", options.active === "usage")}
        ${navLink("/status", "Status", options.active === "status")}
        ${navLink("/mantle-demo", "Mantle Demo", options.active === "mantle")}
      </nav>
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
