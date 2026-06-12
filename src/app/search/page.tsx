import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TokenIcon } from "@/components/ui/token-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { resolvePublicAssetSearch } from "@/lib/catalog";
import type { PublicMatchKind, PublicSearchMatch } from "@/lib/types";

export const metadata: Metadata = { title: "Search" };

const MATCH_KIND_LABELS: Record<PublicMatchKind, string> = {
  address: "Address",
  exact_symbol: "Exact symbol",
  exact_slug: "Exact slug",
  exact_name: "Exact name",
  exact_alias: "Exact alias",
  partial_symbol: "Partial symbol",
  partial_slug: "Partial slug",
  partial_name: "Partial name",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").toString();
  const result = resolvePublicAssetSearch(query);

  if (result.kind === "empty") {
    redirect("/");
  }

  if (result.kind === "redirect" && result.canonicalPath) {
    redirect(result.canonicalPath);
  }

  if (result.kind !== "search_results") {
    const params = new URLSearchParams({
      q: query,
      error: result.message ?? "Search could not resolve that input.",
    });
    redirect(`/?${params.toString()}`);
  }

  const matches = result.matches;

  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Search results</p>
        <h1 className="h-title">Choose a Sentinel-safe public result.</h1>
        <p className="lead">
          {result.message ?? "Search result routing stays inside the public Sentinel surface."}
        </p>
      </section>

      {matches.length === 0 ? (
        <EmptyState
          title="No public result found."
          detail="Try mBURROW, mDEMO, or a 20-byte Mantle address."
        />
      ) : (
        <div className="search-results-list">
          {matches.map((match) => (
            <SearchResultCard key={match.canonicalPath} match={match} />
          ))}
        </div>
      )}
    </>
  );
}

function SearchResultCard({ match }: { match: PublicSearchMatch }) {
  return (
    <article className="search-result-card">
      <div className="asset-row search-result-main">
        <TokenIcon
          logoUrl={match.logoUrl}
          symbol={match.symbol ?? match.title}
          name={match.name ?? match.title}
          className="token-row-icon"
        />
        <div>
          <p className="eyebrow">{MATCH_KIND_LABELS[match.matchKind]}</p>
          <h2 className="h-sub">{match.title}</h2>
          <p>{match.name ?? match.address ?? "Sentinel public result"}</p>
          <div className="tag-row">
            <span className="tag">{match.scope}</span>
            <span className="tag">{match.kind}</span>
            {match.address ? <span className="tag mono">{match.address}</span> : null}
          </div>
        </div>
      </div>
      <a className="button" href={match.canonicalPath}>
        Open
      </a>
    </article>
  );
}
