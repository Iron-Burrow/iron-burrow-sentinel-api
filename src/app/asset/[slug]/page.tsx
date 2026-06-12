import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { TokenIcon } from "@/components/ui/token-icon";
import { findPublicAssetBySlug, findSimilarPublicAssets } from "@/lib/catalog";
import type { PublicCanonicalAsset, PublicSimilarAsset } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const asset = findPublicAssetBySlug(slug);
  return { title: asset ? asset.symbol : "Asset not found" };
}

function formatAssetKind(kind: PublicCanonicalAsset["assetKind"]): string {
  switch (kind) {
    case "native":
      return "Native asset family";
    case "commodity":
      return "Commodity asset family";
    default:
      return "Canonical asset";
  }
}

function formatSimilarMatchKind(matchKind: PublicSimilarAsset["matchKind"]): string {
  switch (matchKind) {
    case "related_asset":
      return "Catalog related";
    case "exact_slug":
      return "Exact slug";
    case "exact_symbol":
      return "Exact symbol";
    case "exact_name":
      return "Exact name";
    case "exact_alias":
      return "Exact alias";
    case "partial_slug":
      return "Partial slug";
    case "partial_symbol":
      return "Partial symbol";
    case "partial_name":
      return "Partial name";
    default:
      return "Asset match";
  }
}

export default async function CanonicalAssetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const asset = findPublicAssetBySlug(slug);

  if (!asset) {
    return (
      <>
        <section className="page-heading">
          <p className="eyebrow">Canonical asset</p>
          <h1 className="h-title">That asset is not in Sentinel&apos;s public catalog.</h1>
          <p className="lead">
            The public UI only resolves curated hackathon-facing assets and valid Mantle addresses.
          </p>
        </section>
        <EmptyState title="Asset not found." detail={`No public Sentinel asset exists for ${slug}.`} />
      </>
    );
  }

  const similar = findSimilarPublicAssets(asset);

  return (
    <>
      <section className="hero asset-hero">
        <div>
          <div className="asset-title">
            <TokenIcon
              logoUrl={asset.logoUrl}
              symbol={asset.symbol}
              name={asset.name}
              className="token-logo"
            />
            <div>
              <p className="eyebrow">Canonical asset</p>
              <h1 className="h-title">{asset.symbol}</h1>
              <p className="lead">
                <strong>{asset.name}</strong>
              </p>
            </div>
          </div>
          <p className="lead">{asset.description}</p>
          <div className="tag-row">
            <span className="tag">{formatAssetKind(asset.assetKind)}</span>
            {asset.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="panel mini-panel">
          <p className="eyebrow">Public boundary</p>
          <h2 className="h-sub">No direct node/RPC/indexer exposure</h2>
          <p>
            Canonical pages expose curated demo metadata and route only to Sentinel-owned public
            surfaces.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Representations</p>
            <h2 className="h-sub">Known public Mantle routes</h2>
          </div>
          <Pill label="Honest partial coverage" tone="partial" />
        </div>
        {asset.representations.length === 0 ? (
          <EmptyState
            title="No public representations are available yet."
            detail="Sentinel knows this canonical asset but has no safe chain page to expose."
          />
        ) : (
          <div className="table-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Representation</th>
                  <th>Chain</th>
                  <th>Status</th>
                  <th>Route</th>
                </tr>
              </thead>
              <tbody>
                {asset.representations.map((representation) => (
                  <tr key={representation.address}>
                    <td>
                      <div className="asset-row">
                        <TokenIcon
                          logoUrl={representation.logoUrl}
                          symbol={representation.symbol}
                          name={representation.name}
                          className="token-row-icon"
                        />
                        <div>
                          <strong>{representation.symbol}</strong>
                          <div className="subtle">{representation.name}</div>
                          <div className="mono subtle">{representation.address}</div>
                        </div>
                      </div>
                    </td>
                    <td>{representation.chain}</td>
                    <td>
                      <Pill
                        label={
                          representation.indexedStatus === "partial"
                            ? "Partial demo coverage"
                            : "Demo signal"
                        }
                        tone="partial"
                      />
                    </td>
                    <td>
                      <a className="button secondary" href={representation.canonicalPath}>
                        Open Mantle page
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Data readiness</p>
            <h2 className="h-sub">Price, holders, and liquidity</h2>
          </div>
          <Pill label="Not available yet" tone="partial" />
        </div>
        <div className="meta-grid">
          <div>
            <dt>Price</dt>
            <dd>No public price feed is exposed for this canonical asset yet.</dd>
          </div>
          <div>
            <dt>Holders</dt>
            <dd>Holder data requires a known indexed Mantle representation.</dd>
          </div>
          <div>
            <dt>Liquidity</dt>
            <dd>Liquidity signals are only shown when Sentinel has curated public data.</dd>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Similar Assets</p>
            <h2 className="h-sub">Related public canonical assets</h2>
          </div>
        </div>
        {similar.length === 0 ? (
          <EmptyState
            title="No similar assets are listed yet."
            detail="Sentinel has no related public canonical assets to show for this symbol."
          />
        ) : (
          <div className="table-panel">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Match</th>
                  <th>Route</th>
                </tr>
              </thead>
              <tbody>
                {similar.map((similarAsset) => (
                  <tr key={similarAsset.slug}>
                    <td>
                      <div className="asset-row">
                        <TokenIcon
                          logoUrl={similarAsset.logoUrl}
                          symbol={similarAsset.symbol}
                          name={similarAsset.name}
                          className="token-row-icon"
                        />
                        <div>
                          <strong>{similarAsset.symbol}</strong>
                          <div className="subtle">{similarAsset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Pill label={formatSimilarMatchKind(similarAsset.matchKind)} tone="partial" />
                    </td>
                    <td>
                      <a className="button secondary" href={similarAsset.canonicalPath}>
                        Open canonical asset
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
