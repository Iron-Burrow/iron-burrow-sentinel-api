import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { TopBar } from "@/components/top-bar";
import { getCurrency } from "@/lib/currency";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Iron Burrow Sentinel",
    template: "%s | Iron Burrow Sentinel",
  },
  description: "Public Mantle intelligence for agents and builders.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currency = await getCurrency();

  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body>
        <TopBar currency={currency} />
        <main className="page-main">{children}</main>
      </body>
    </html>
  );
}
