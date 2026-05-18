import type { PublicCanonicalAsset, PublicSimilarAsset } from "../src/public-catalog.js";
import { emptyState, escapeHtml, renderLayout, renderTokenIcon, statusPill } from "./layout.js";

function formatMatchKind(matchKind: PublicSimilarAsset["matchKind"]): string {
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

export function renderCanonicalAssetPage(asset: PublicCanonicalAsset, similarAssets: PublicSimilarAsset[] = []): string {
  const representations =
    asset.representations.length === 0
      ? emptyState("No public representations are available yet.", "Sentinel knows this canonical asset but has no safe chain page to expose.", "partial")
      : `<div class="table-panel">
        <table>
          <thead><tr><th>Representation</th><th>Chain</th><th>Status</th><th>Route</th></tr></thead>
          <tbody>
            ${asset.representations
              .map(
                (representation) => `<tr>
                  <td>
                    <div class="asset-row">
                      ${renderTokenIcon({
                        logoUrl: representation.logoUrl,
                        symbol: representation.symbol,
                        name: representation.name,
                        className: "token-row-icon"
                      })}
                      <div>
                        <strong>${escapeHtml(representation.symbol)}</strong>
                        <div class="subtle">${escapeHtml(representation.name)}</div>
                        <div class="mono subtle">${escapeHtml(representation.address)}</div>
                      </div>
                    </div>
                  </td>
                  <td>${escapeHtml(representation.chain)}</td>
                  <td>${statusPill(representation.indexedStatus === "partial" ? "Partial demo coverage" : "Demo signal", "partial")}</td>
                  <td><a class="button secondary" href="${escapeHtml(representation.canonicalPath)}">Open Mantle page</a></td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
  const similarAssetsMarkup =
    similarAssets.length === 0
      ? emptyState("No similar assets are listed yet.", "Sentinel has no related public canonical assets to show for this symbol.", "partial")
      : `<div class="table-panel">
        <table>
          <thead><tr><th>Asset</th><th>Match</th><th>Route</th></tr></thead>
          <tbody>
            ${similarAssets
              .map(
                (similarAsset) => `<tr>
                  <td>
                    <div class="asset-row">
                      ${renderTokenIcon({
                        logoUrl: similarAsset.logoUrl,
                        symbol: similarAsset.symbol,
                        name: similarAsset.name,
                        className: "token-row-icon"
                      })}
                      <div>
                        <strong>${escapeHtml(similarAsset.symbol)}</strong>
                        <div class="subtle">${escapeHtml(similarAsset.name)}</div>
                      </div>
                    </div>
                  </td>
                  <td>${statusPill(formatMatchKind(similarAsset.matchKind), "partial")}</td>
                  <td><a class="button secondary" href="${escapeHtml(similarAsset.canonicalPath)}">Open canonical asset</a></td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;

  return renderLayout({
    title: asset.symbol,
    active: "asset",
    body: `<section class="hero asset-hero">
      <div>
        <div class="asset-title">
          ${renderTokenIcon({
            logoUrl: asset.logoUrl,
            symbol: asset.symbol,
            name: asset.name,
            className: "token-logo"
          })}
          <div>
            <p class="eyebrow">Canonical asset</p>
            <h1>${escapeHtml(asset.symbol)}</h1>
            <p class="lead"><strong>${escapeHtml(asset.name)}</strong></p>
          </div>
        </div>
        <p class="lead">${escapeHtml(asset.description)}</p>
        <div class="tag-row">
          <span class="tag">${escapeHtml(formatAssetKind(asset.assetKind))}</span>
          ${asset.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
      <div class="panel mini-panel">
        <p class="eyebrow">Public boundary</p>
        <h2>No direct node/RPC/indexer exposure</h2>
        <p>Canonical pages expose curated demo metadata and route only to Sentinel-owned public surfaces.</p>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Representations</p>
          <h2>Known public Mantle routes</h2>
        </div>
        ${statusPill("Honest partial coverage", "partial")}
      </div>
      ${representations}
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Data readiness</p>
          <h2>Price, holders, and liquidity</h2>
        </div>
        ${statusPill("Not available yet", "partial")}
      </div>
      <div class="meta-grid">
        <div><dt>Price</dt><dd>No public price feed is exposed for this canonical asset yet.</dd></div>
        <div><dt>Holders</dt><dd>Holder data requires a known indexed Mantle representation.</dd></div>
        <div><dt>Liquidity</dt><dd>Liquidity signals are only shown when Sentinel has curated public data.</dd></div>
      </div>
    </section>

    <section class="panel">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Similar Assets</p>
          <h2>Related public canonical assets</h2>
        </div>
      </div>
      ${similarAssetsMarkup}
    </section>`
  });
}

export function renderAssetNotFoundPage(slug: string): string {
  return renderLayout({
    title: "Asset not found",
    active: "asset",
    body: `<section class="page-heading">
      <p class="eyebrow">Canonical asset</p>
      <h1>That asset is not in Sentinel's public catalog.</h1>
      <p class="lead">The public UI only resolves curated hackathon-facing assets and valid Mantle addresses.</p>
    </section>
    ${emptyState("Asset not found.", `No public Sentinel asset exists for ${slug}.`, "partial")}`
  });
}
