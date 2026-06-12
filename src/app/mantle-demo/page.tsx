import type { Metadata } from "next";

import { ChatWidget } from "@/components/mantle/chat-widget";
import { ParticleBackground } from "@/components/mantle/particle-background";
import { EmptyState } from "@/components/ui/empty-state";
import { listIronBurrowAssets } from "@/lib/iron-burrow";

export const metadata: Metadata = { title: "Mantle Explorer" };

const CATEGORY_TAGS = ["Address", "Token", "Holder", "Liquidity", "Concentration", "Block"];

export default async function MantleDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const assets = await listIronBurrowAssets();

  return (
    <>
      <ParticleBackground />

      <section className="bs-hero bs-hero-dark">
        <div className="bs-hero-inner">
          <h1 className="bs-title">
            Mantle intelligence
            <br />
            <span className="bs-title-accent">Expand your exploration</span>
          </h1>
          <div className="bs-hero-actions">
            <a className="bs-action-btn primary" href="#search">
              Search on chain
            </a>
            <a className="bs-action-btn" href="/docs">
              Explore API
            </a>
          </div>
          <form className="bs-search" action="/mantle-demo/search" method="get" id="search">
            <span className="bs-search-icon">🔍</span>
            <input
              name="q"
              placeholder="Search by token / symbol / name..."
              aria-label="Search assets"
              autoComplete="off"
            />
          </form>
          {error ? (
            <div className="bs-search-error" role="alert">
              {error}
            </div>
          ) : null}
          <div className="bs-cat-tags">
            <span className="bs-cat-label">Try searching by:</span>
            {CATEGORY_TAGS.map((tag) => (
              <span key={tag} className="bs-cat-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bs-featured">
        <h2 className="bs-section-title">Featured assets</h2>
        <p className="bs-section-sub">Select a token to investigate intelligence signals</p>
        {assets.length === 0 ? (
          <EmptyState
            title="Featured assets unavailable."
            detail="Could not reach the Iron Burrow asset catalog."
            tone="unavailable"
          />
        ) : (
          <div className="bs-asset-tags">
            {assets.map((asset) => (
              <a
                key={asset.asset_id}
                className="bs-asset-tag"
                href={`/mantle/asset/${asset.asset_id}`}
                title={asset.name}
              >
                <span className="bs-asset-tag-icon">{asset.symbol.slice(0, 2)}</span>
                <span>{asset.symbol}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <ChatWidget />
    </>
  );
}
