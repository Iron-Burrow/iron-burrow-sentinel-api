export interface TokenMediaLookupInput {
  address?: string | null;
  slug?: string | null;
  symbol?: string | null;
  name?: string | null;
}

const mediaByAddress: Record<string, string> = {
  "0x3333333333333333333333333333333333333333": "wrapped-bitcoin-wbtc-icon.png"
};

const mediaBySymbol: Record<string, string> = {
  aave: "aave-aave-logo.png",
  btc: "bitcoin-btc-logo.png",
  dai: "multi-collateral-dai-dai-logo.png",
  eth: "ethereum-eth-logo.png",
  gho: "gho-token-logo.png",
  usdc: "usd-coin-usdc-logo.png",
  usdt: "tether-usdt-logo.png",
  wbtc: "wrapped-bitcoin-wbtc-icon.png"
};

const mediaByName: Record<string, string> = {
  aave: "aave-aave-logo.png",
  bitcoin: "bitcoin-btc-logo.png",
  dai: "multi-collateral-dai-dai-logo.png",
  ether: "ethereum-eth-logo.png",
  ethereum: "ethereum-eth-logo.png",
  gho: "gho-token-logo.png",
  "multi-collateral dai": "multi-collateral-dai-dai-logo.png",
  tether: "tether-usdt-logo.png",
  "usd coin": "usd-coin-usdc-logo.png",
  "wrapped bitcoin": "wrapped-bitcoin-wbtc-icon.png"
};

function normalizeLookupValue(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}

export function resolveTokenMediaFile(input: TokenMediaLookupInput): string | null {
  const address = normalizeLookupValue(input.address);

  if (address && mediaByAddress[address]) {
    return mediaByAddress[address];
  }

  const symbol = normalizeLookupValue(input.symbol);

  if (symbol && mediaBySymbol[symbol]) {
    return mediaBySymbol[symbol];
  }

  const slug = normalizeLookupValue(input.slug);

  if (slug && mediaBySymbol[slug]) {
    return mediaBySymbol[slug];
  }

  const name = normalizeLookupValue(input.name);

  if (name && mediaByName[name]) {
    return mediaByName[name];
  }

  return null;
}

export function resolveTokenMediaUrl(input: TokenMediaLookupInput): string | null {
  const file = resolveTokenMediaFile(input);
  return file ? `/media/${file}` : null;
}
