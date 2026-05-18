import { renderLayout } from "./layout.js";
import { escapeHtml } from "./layout.js";

export function renderLandingPage(options: { query?: string; error?: string } = {}): string {
  const query = escapeHtml(options.query ?? "");
  const error = options.error
    ? `<div class="banner unavailable"><strong>Search not resolved.</strong><p>${escapeHtml(options.error)}</p></div>`
    : "";

  return renderLayout({
    title: "Home",
    active: "home",
    searchQuery: options.query,
    body: `<section class="hero">
      <div>
        <p class="eyebrow">Hackathon-facing public API</p>
        <h1>Public Mantle intelligence for agents and builders.</h1>
        <p class="lead">Iron Burrow Sentinel exposes source-aware responses and honest partial coverage without direct node, RPC, indexer, or internal gateway exposure.</p>
        <form class="search-card" action="/search" method="get">
          <label for="home-search">Search a canonical asset or Mantle address</label>
          <div class="search-row">
            <input id="home-search" name="q" value="${query}" placeholder="mBURROW, mDEMO, or 0x1111..." />
            <button class="button" type="submit">Resolve</button>
          </div>
        </form>
        ${error}
        <div class="actions">
          <a class="button" href="/api-keys">Create API key</a>
          <a class="button secondary" href="/docs">Read docs</a>
        </div>
      </div>
      <div class="signal-board" aria-label="Sentinel principles">
        <div><strong>Sentinel</strong><span>public table</span></div>
        <div><strong>Search</strong><span>safe resolver</span></div>
        <div><strong>Assets</strong><span>curated demo catalog</span></div>
        <div><strong>Internals</strong><span>not exposed</span></div>
      </div>
    </section>

    <section class="grid three">
      <article class="panel">
        <p class="eyebrow">Search first</p>
        <h2>Resolve public assets</h2>
        <p>Search normalizes symbols, slugs, names, and Mantle addresses into Sentinel-safe pages.</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Use the API</p>
        <h2>Call Mantle routes</h2>
        <p>Summary, holders, concentration, and liquidity-delta responses share stable shapes.</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Stay honest</p>
        <h2>Read metadata</h2>
        <p>Responses include source, freshness, indexed block, confidence, partial flags, and warnings.</p>
      </article>
    </section>`
  });
}
