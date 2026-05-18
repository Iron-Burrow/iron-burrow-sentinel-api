import type { PublicSearchMatch } from "../src/public-catalog.js";
import { emptyState, escapeHtml, renderLayout } from "./layout.js";

function formatMatchKind(matchKind: PublicSearchMatch["matchKind"]): string {
  const labels: Record<PublicSearchMatch["matchKind"], string> = {
    address: "Address",
    exact_symbol: "Exact symbol",
    exact_slug: "Exact slug",
    exact_name: "Exact name",
    partial_symbol: "Partial symbol",
    partial_slug: "Partial slug",
    partial_name: "Partial name"
  };

  return labels[matchKind];
}

export function renderSearchResultsPage(input: { query: string; matches: PublicSearchMatch[]; message?: string | null }): string {
  const matches =
    input.matches.length === 0
      ? emptyState("No public result found.", "Try mBURROW, mDEMO, or a 20-byte Mantle address.", "partial")
      : `<div class="search-results-list">
        ${input.matches
          .map(
            (match) => `<article class="search-result-card">
              <div>
                <p class="eyebrow">${escapeHtml(formatMatchKind(match.matchKind))}</p>
                <h2>${escapeHtml(match.title)}</h2>
                <p>${escapeHtml(match.name ?? match.address ?? "Sentinel public result")}</p>
                <div class="tag-row">
                  <span class="tag">${escapeHtml(match.scope)}</span>
                  <span class="tag">${escapeHtml(match.kind)}</span>
                  ${match.address ? `<span class="tag mono">${escapeHtml(match.address)}</span>` : ""}
                </div>
              </div>
              <a class="button" href="${escapeHtml(match.canonicalPath)}">Open</a>
            </article>`
          )
          .join("")}
      </div>`;

  return renderLayout({
    title: `Search ${input.query}`,
    active: "asset",
    searchQuery: input.query,
    body: `<section class="page-heading">
      <p class="eyebrow">Search results</p>
      <h1>Choose a Sentinel-safe public result.</h1>
      <p class="lead">${escapeHtml(input.message ?? "Search result routing stays inside the public Sentinel surface.")}</p>
    </section>
    ${matches}`
  });
}
