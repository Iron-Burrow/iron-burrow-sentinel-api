import { tokenInitials } from "@/lib/format";

export function TokenIcon({
  logoUrl,
  symbol,
  name,
  className = "token-logo",
}: {
  logoUrl: string | null;
  symbol: string | null;
  name: string | null;
  className?: string;
}) {
  const label = name ?? symbol ?? "Token";

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} src={logoUrl} alt={`${label} logo`} loading="lazy" />
    );
  }

  return (
    <span className={`${className} token-badge`} aria-label={`${label} logo fallback`}>
      {tokenInitials(symbol ?? label)}
    </span>
  );
}
