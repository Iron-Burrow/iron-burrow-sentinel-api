import type { Metadata } from "next";

export const metadata: Metadata = { title: "Home" };

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error } = await searchParams;

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Hackathon-facing public API</p>
          <h1 className="h-title">Public Mantle intelligence for agents and builders.</h1>
          <p className="lead">
            Iron Burrow Sentinel exposes source-aware responses and honest partial coverage without
            direct node, RPC, indexer, or internal gateway exposure.
          </p>
          <form className="search-card" action="/search" method="get">
            <label htmlFor="home-search">Search a canonical asset or Mantle address</label>
            <div className="search-row">
              <input
                id="home-search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="mBURROW, mDEMO, or 0x1111..."
              />
              <button className="button" type="submit">
                Resolve
              </button>
            </div>
          </form>
          {error ? (
            <div className="banner unavailable">
              <strong>Search not resolved.</strong>
              <p>{error}</p>
            </div>
          ) : null}
          <div className="actions">
            <a className="button" href="/api-keys">
              Create API key
            </a>
            <a className="button secondary" href="/docs">
              Read docs
            </a>
          </div>
        </div>
        <div className="signal-board" aria-label="Sentinel principles">
          <div>
            <strong>Sentinel</strong>
            <span>public table</span>
          </div>
          <div>
            <strong>Search</strong>
            <span>safe resolver</span>
          </div>
          <div>
            <strong>Assets</strong>
            <span>curated demo catalog</span>
          </div>
          <div>
            <strong>Internals</strong>
            <span>not exposed</span>
          </div>
        </div>
      </section>

      <section className="grid three">
        <article className="panel">
          <p className="eyebrow">Search first</p>
          <h2 className="h-sub">Resolve public assets</h2>
          <p>Search normalizes symbols, slugs, names, and Mantle addresses into Sentinel-safe pages.</p>
        </article>
        <article className="panel">
          <p className="eyebrow">Use the API</p>
          <h2 className="h-sub">Call Mantle routes</h2>
          <p>Summary, holders, concentration, and liquidity-delta responses share stable shapes.</p>
        </article>
        <article className="panel">
          <p className="eyebrow">Stay honest</p>
          <h2 className="h-sub">Read metadata</h2>
          <p>Responses include source, freshness, indexed block, confidence, partial flags, and warnings.</p>
        </article>
      </section>
    </>
  );
}
