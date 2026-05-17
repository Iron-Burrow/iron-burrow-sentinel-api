import { renderLayout } from "./layout.js";

export function renderLandingPage(): string {
  return renderLayout({
    title: "Home",
    active: "home",
    body: `<section class="hero">
      <div>
        <p class="eyebrow">Mantle hackathon API</p>
        <h1>Source-aware on-chain intelligence for agents and builders.</h1>
        <p class="lead">Sentinel exposes structured demo intelligence without exposing private indexers, RPC nodes, or internal infrastructure. Create a key, test the API, inspect usage, and keep every response honest about partial coverage.</p>
        <div class="actions">
          <a class="button" href="/api-keys">Create API key</a>
          <a class="button secondary" href="/docs">Read docs</a>
        </div>
      </div>
      <div class="signal-board" aria-label="Sentinel principles">
        <div><strong>Sentinel</strong><span>public table</span></div>
        <div><strong>Bigwig</strong><span>burrow entrance</span></div>
        <div><strong>Indexers</strong><span>cook underground</span></div>
        <div><strong>Nodes</strong><span>never meet strangers</span></div>
      </div>
    </section>

    <section class="grid three">
      <article class="panel">
        <p class="eyebrow">Serve yourself</p>
        <h2>Create a key</h2>
        <p>Hackathon-simple account creation. Keys are shown once and stored hashed.</p>
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
