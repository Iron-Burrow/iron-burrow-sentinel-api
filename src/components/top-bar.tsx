"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Currency } from "@/lib/types";

const NAV_LINKS: Array<{ href: string; label: string; match: (path: string) => boolean }> = [
  { href: "/", label: "Home", match: (p) => p === "/" },
  { href: "/docs", label: "Docs", match: (p) => p.startsWith("/docs") },
  { href: "/app", label: "Dashboard", match: (p) => p.startsWith("/app") },
  { href: "/api-keys", label: "API Keys", match: (p) => p.startsWith("/api-keys") },
  { href: "/usage", label: "Usage", match: (p) => p.startsWith("/usage") },
  { href: "/status", label: "Status", match: (p) => p.startsWith("/status") },
  {
    href: "/mantle-demo",
    label: "Mantle Demo",
    match: (p) => p.startsWith("/mantle-demo") || p.startsWith("/mantle/"),
  },
];

export function TopBar({ currency }: { currency: Currency }) {
  const pathname = usePathname() ?? "/";

  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Iron Burrow Sentinel home">
        <span className="brand-mark app-logo-wrap">
          <span className="brand-fallback">IB</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="app-logo" src="/media/sentinel-api.png" alt="" aria-hidden="true" />
        </span>
        <span>
          <strong>Iron Burrow Sentinel</strong>
          <small>Public Mantle intelligence</small>
        </span>
      </Link>

      <nav className="topnav" aria-label="Primary">
        {NAV_LINKS.map((link) => {
          const active = link.match(pathname);
          return (
            <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form className="nav-search" action="/search" method="get">
        <input name="q" placeholder="Search mBURROW or 0x..." aria-label="Search Sentinel assets" />
        <button type="submit">Go</button>
      </form>

      <CurrencySwitch current={currency} />
    </header>
  );
}

function CurrencySwitch({ current }: { current: Currency }) {
  return (
    <div className="currency-switch" role="group" aria-label="Display currency">
      {(["USD", "MXN"] as const).map((value) => (
        <a
          key={value}
          className={`currency-opt${current === value ? " active" : ""}`}
          href={`/currency/${value}`}
          aria-current={current === value ? "true" : "false"}
        >
          {value}
        </a>
      ))}
    </div>
  );
}
