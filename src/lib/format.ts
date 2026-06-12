// Presentation helpers shared by Server and Client Components. Pure functions.

import type { Currency } from "./types";

export function formatPrice(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  if (num >= 1000) return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (num >= 1) return num.toFixed(4);
  return num.toFixed(6);
}

export function currencyPrefix(currency: Currency): string {
  return currency === "MXN" ? "MX$" : "$";
}

export function formatRecordedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function formatUsd(value: string): string {
  const num = Number(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

export function truncAddr(address: string): string {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

export function tokenInitials(value: string): string {
  const compact = value.replace(/[^a-zA-Z0-9]/gu, "").toUpperCase();
  return compact.length === 0 ? "IB" : compact.slice(0, 3);
}
