"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close the menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click / Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="topbar" ref={headerRef}>
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

      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="topbar-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div className="topbar-menu" id="topbar-menu" data-open={open}>
        <nav className="topnav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.match(pathname) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form className="nav-search" action="/search" method="get">
          <input name="q" placeholder="Search mBURROW or 0x..." aria-label="Search Sentinel assets" />
          <button type="submit">Go</button>
        </form>

        <CurrencySwitch current={currency} />
      </div>
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

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
