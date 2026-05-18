import type { PublicCanonicalAsset } from "../src/public-catalog.js";
import { emptyState, escapeHtml, renderLayout, statusPill } from "./layout.js";

export function renderCanonicalAssetPage(asset: PublicCanonicalAsset): string {
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
                    <strong>${escapeHtml(representation.symbol)}</strong>
                    <div class="subtle">${escapeHtml(representation.name)}</div>
                    <div class="mono subtle">${escapeHtml(representation.address)}</div>
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

  return renderLayout({
    title: asset.symbol,
    active: "asset",
    body: `<section class="hero asset-hero">
      <div>
        <p class="eyebrow">Canonical asset</p>
        <h1>${escapeHtml(asset.symbol)}</h1>
        <p class="lead">${escapeHtml(asset.description)}</p>
        <div class="tag-row">
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
