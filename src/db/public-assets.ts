import {
  isMantleAddress,
  normalizeMantleAddress,
  normalizePublicSearchQuery,
  normalizeSlug,
  type PublicAssetChain,
  type PublicAssetIndexedStatus,
  type PublicAssetKind,
  type PublicAssetRepresentation,
  type PublicCanonicalAsset,
  type PublicResolveResult,
  type PublicSearchMatch,
  type PublicSimilarAsset
} from "../public-catalog.js";
import { query } from "./client.js";

interface PublicAssetRow {
  slug: string;
  symbol: string;
  name: string;
  description: string;
  asset_kind: PublicAssetKind;
  aliases: string[];
  related_asset_slugs: string[];
  tags: string[];
}

interface PublicRepresentationRow {
  asset_slug: string;
  chain: PublicAssetChain;
  address: string;
  symbol: string;
  name: string;
  indexed_status: PublicAssetIndexedStatus;
  canonical_path: string;
}

const publicAssetSelect = `
  select slug, symbol, name, description, asset_kind, aliases, related_asset_slugs, tags
  from public_assets
  where is_active = true
`;

const publicRepresentationSelect = `
  select
    representation.asset_slug,
    representation.chain,
    lower(representation.address) as address,
    representation.symbol,
    representation.name,
    representation.indexed_status,
    representation.canonical_path
  from public_asset_representations representation
  join public_assets asset on asset.slug = representation.asset_slug
  where asset.is_active = true
    and representation.is_active = true
`;

function mapRepresentation(row: PublicRepresentationRow): PublicAssetRepresentation {
  return {
    chain: row.chain,
    address: normalizeMantleAddress(row.address),
    canonicalPath: row.canonical_path,
    indexedStatus: row.indexed_status,
    name: row.name,
    symbol: row.symbol
  };
}

function mapAssets(assetRows: PublicAssetRow[], representationRows: PublicRepresentationRow[]): PublicCanonicalAsset[] {
  const representationsBySlug = new Map<string, PublicAssetRepresentation[]>();

  for (const row of representationRows) {
    const representations = representationsBySlug.get(row.asset_slug) ?? [];
    representations.push(mapRepresentation(row));
    representationsBySlug.set(row.asset_slug, representations);
  }

  return assetRows.map((row) => ({
    slug: row.slug,
    symbol: row.symbol,
    name: row.name,
    description: row.description,
    assetKind: row.asset_kind,
    aliases: row.aliases,
    relatedAssetSlugs: row.related_asset_slugs,
    tags: row.tags,
    representations: representationsBySlug.get(row.slug) ?? []
  }));
}

function buildCanonicalMatch(asset: PublicCanonicalAsset, matchKind: PublicSearchMatch["matchKind"]): PublicSearchMatch {
  return {
    kind: "canonical_asset",
    scope: "canonical",
    canonicalPath: `/asset/${asset.slug}`,
    title: asset.symbol,
    slug: asset.slug,
    symbol: asset.symbol,
    name: asset.name,
    address: asset.representations[0]?.address ?? null,
    matchKind
  };
}

function buildSimilarAsset(asset: PublicCanonicalAsset, matchKind: PublicSimilarAsset["matchKind"]): PublicSimilarAsset {
  return {
    slug: asset.slug,
    symbol: asset.symbol,
    name: asset.name,
    matchKind,
    canonicalPath: `/asset/${asset.slug}`
  };
}

function buildAddressMatch(address: string, asset: PublicCanonicalAsset | null): PublicSearchMatch {
  const normalizedAddress = normalizeMantleAddress(address);

  return {
    kind: "mantle_asset",
    scope: "chain",
    canonicalPath: `/mantle/asset/${normalizedAddress}`,
    title: asset?.symbol ?? "Mantle asset",
    slug: asset?.slug ?? null,
    symbol: asset?.symbol ?? null,
    name: asset?.name ?? null,
    address: normalizedAddress,
    matchKind: "address"
  };
}

async function loadAssets(
  connectionString: string,
  assetSql: string,
  assetParams: unknown[] = []
): Promise<PublicCanonicalAsset[]> {
  const assetRows = await query<PublicAssetRow>(connectionString, assetSql, assetParams);

  if (assetRows.length === 0) {
    return [];
  }

  const slugs = assetRows.map((row) => row.slug);
  const representationRows = await query<PublicRepresentationRow>(
    connectionString,
    `
    ${publicRepresentationSelect}
      and representation.asset_slug = any($1::text[])
    order by representation.asset_slug asc, lower(representation.address) asc
    `,
    [slugs]
  );

  return mapAssets(assetRows, representationRows);
}

export async function listPublicAssets(connectionString: string): Promise<PublicCanonicalAsset[]> {
  return loadAssets(
    connectionString,
    `
    ${publicAssetSelect}
    order by slug asc
    `
  );
}

export async function findPublicAssetBySlug(
  connectionString: string,
  slug: string
): Promise<PublicCanonicalAsset | null> {
  const assets = await loadAssets(
    connectionString,
    `
    ${publicAssetSelect}
      and lower(slug) = $1
    order by slug asc
    `,
    [normalizeSlug(slug)]
  );

  return assets[0] ?? null;
}

export async function findPublicAssetByAddress(
  connectionString: string,
  address: string
): Promise<PublicCanonicalAsset | null> {
  const normalizedAddress = normalizeMantleAddress(address);
  const rows = await query<PublicAssetRow>(
    connectionString,
    `
    ${publicAssetSelect}
      and slug in (
        select representation.asset_slug
        from public_asset_representations representation
        where representation.is_active = true
          and lower(representation.address) = $1
      )
    order by slug asc
    limit 1
    `,
    [normalizedAddress]
  );

  if (!rows[0]) {
    return null;
  }

  const assets = await loadAssets(
    connectionString,
    `
    ${publicAssetSelect}
      and slug = $1
    `,
    [rows[0].slug]
  );

  return assets[0] ?? null;
}

async function findExactMatches(
  connectionString: string,
  normalizedQuery: string
): Promise<Array<{ asset: PublicCanonicalAsset; matchKind: PublicSearchMatch["matchKind"] }>> {
  const slugMatch = await findPublicAssetBySlug(connectionString, normalizedQuery);

  if (slugMatch) {
    return [{ asset: slugMatch, matchKind: "exact_slug" }];
  }

  const symbolMatches = await loadAssets(
    connectionString,
    `
    ${publicAssetSelect}
      and upper(symbol) = $1
    order by slug asc
    `,
    [normalizedQuery.toUpperCase()]
  );

  if (symbolMatches.length > 0) {
    return symbolMatches.map((asset) => ({ asset, matchKind: "exact_symbol" }));
  }

  const nameMatches = await loadAssets(
    connectionString,
    `
    ${publicAssetSelect}
      and lower(name) = $1
    order by slug asc
    `,
    [normalizedQuery.toLowerCase()]
  );

  return nameMatches.map((asset) => ({ asset, matchKind: "exact_name" }));
}

async function findAliasMatches(
  connectionString: string,
  normalizedQuery: string
): Promise<Array<{ asset: PublicCanonicalAsset; matchKind: PublicSearchMatch["matchKind"] }>> {
  const assets = await loadAssets(
    connectionString,
    `
    ${publicAssetSelect}
      and exists (
        select 1
        from unnest(aliases) alias
        where lower(alias) = $1
      )
    order by slug asc
    `,
    [normalizedQuery.toLowerCase()]
  );

  return assets.map((asset) => ({ asset, matchKind: "exact_alias" }));
}

async function findPartialMatches(
  connectionString: string,
  normalizedQuery: string
): Promise<Array<{ asset: PublicCanonicalAsset; matchKind: PublicSearchMatch["matchKind"] }>> {
  const partialRows = await query<PublicAssetRow & { match_kind: PublicSearchMatch["matchKind"]; priority: number }>(
    connectionString,
    `
    select
      slug,
      symbol,
      name,
      description,
      asset_kind,
      aliases,
      related_asset_slugs,
      tags,
      case
        when lower(slug) like $1 then 'partial_slug'
        when upper(symbol) like $2 then 'partial_symbol'
        else 'partial_name'
      end as match_kind,
      case
        when lower(slug) like $1 then 1
        when upper(symbol) like $2 then 2
        else 3
      end as priority
    from public_assets
    where is_active = true
      and (
        lower(slug) like $1
        or upper(symbol) like $2
        or lower(name) like $3
      )
    order by priority asc, slug asc
    `,
    [`%${normalizeSlug(normalizedQuery)}%`, `%${normalizedQuery.toUpperCase()}%`, `%${normalizedQuery.toLowerCase()}%`]
  );

  const assets = await loadAssets(
    connectionString,
    `
    ${publicAssetSelect}
      and slug = any($1::text[])
    order by slug asc
    `,
    [partialRows.map((row) => row.slug)]
  );
  const assetsBySlug = new Map(assets.map((asset) => [asset.slug, asset]));

  return partialRows.flatMap((row) => {
    const asset = assetsBySlug.get(row.slug);
    return asset ? [{ asset, matchKind: row.match_kind }] : [];
  });
}

export async function findSimilarPublicAssets(
  connectionString: string,
  asset: PublicCanonicalAsset,
  limit = 8
): Promise<PublicSimilarAsset[]> {
  if (asset.relatedAssetSlugs.length > 0) {
    const relatedAssets = await loadAssets(
      connectionString,
      `
      ${publicAssetSelect}
        and slug = any($1::text[])
      order by array_position($1::text[], slug), slug asc
      `,
      [asset.relatedAssetSlugs]
    );

    const relatedMatches = relatedAssets
      .filter((candidate) => candidate.slug !== asset.slug)
      .slice(0, limit)
      .map((candidate) => buildSimilarAsset(candidate, "related_asset"));

    return relatedMatches;
  }

  const collectSimilarAssets = async (queryValue: string): Promise<PublicSimilarAsset[]> =>
    (await findPartialMatches(connectionString, normalizePublicSearchQuery(queryValue)))
      .filter((candidate) => candidate.asset.slug !== asset.slug)
      .slice(0, limit)
      .map((candidate) => buildSimilarAsset(candidate.asset, candidate.matchKind));

  const symbolMatches = await collectSimilarAssets(asset.symbol);

  if (symbolMatches.length > 0) {
    return symbolMatches;
  }

  const prefix = normalizePublicSearchQuery(asset.symbol).slice(0, 1);
  return prefix ? collectSimilarAssets(prefix) : [];
}

export async function resolvePublicAssetSearch(
  connectionString: string,
  queryValue: string
): Promise<PublicResolveResult> {
  const normalizedQuery = normalizePublicSearchQuery(queryValue);

  if (!normalizedQuery) {
    return {
      ok: true,
      query: queryValue,
      normalizedQuery,
      kind: "empty",
      canonicalPath: null,
      matches: [],
      message: "Enter a symbol, asset name, slug, or Mantle address."
    };
  }

  if (isMantleAddress(normalizedQuery)) {
    const normalizedAddress = normalizeMantleAddress(normalizedQuery);
    const asset = await findPublicAssetByAddress(connectionString, normalizedAddress);
    const match = buildAddressMatch(normalizedAddress, asset);

    return {
      ok: true,
      query: queryValue,
      normalizedQuery: normalizedAddress,
      kind: "redirect",
      canonicalPath: match.canonicalPath,
      matches: [match],
      message: null
    };
  }

  const exactMatches = await findExactMatches(connectionString, normalizedQuery);
  const aliasMatches = exactMatches.length > 0 ? [] : await findAliasMatches(connectionString, normalizedQuery);
  const matches =
    exactMatches.length > 0
      ? exactMatches.map(({ asset, matchKind }) => buildCanonicalMatch(asset, matchKind))
      : aliasMatches.length > 0
        ? aliasMatches.map(({ asset, matchKind }) => buildCanonicalMatch(asset, matchKind))
      : (await findPartialMatches(connectionString, normalizedQuery)).map(({ asset, matchKind }) =>
          buildCanonicalMatch(asset, matchKind)
        );

  if (matches.length === 1 && (exactMatches.length === 1 || aliasMatches.length === 1)) {
    return {
      ok: true,
      query: queryValue,
      normalizedQuery,
      kind: "redirect",
      canonicalPath: matches[0]?.canonicalPath ?? null,
      matches,
      message: null
    };
  }

  if (matches.length > 0) {
    return {
      ok: true,
      query: queryValue,
      normalizedQuery,
      kind: "search_results",
      canonicalPath: null,
      matches,
      message: "Choose a Sentinel-safe canonical asset or Mantle representation."
    };
  }

  return {
    ok: true,
    query: queryValue,
    normalizedQuery,
    kind: "unknown",
    canonicalPath: null,
    matches: [],
    message: "That input did not resolve to a public Sentinel asset or Mantle address."
  };
}
