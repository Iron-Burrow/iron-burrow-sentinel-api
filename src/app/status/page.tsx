import type { Metadata } from "next";

import { StatusPanel } from "@/components/account/status-panel";

export const metadata: Metadata = { title: "Status" };

export default function StatusPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Status</p>
        <h1 className="h-title">Public service status</h1>
        <p className="lead">
          This page reports app/database health and demo coverage without revealing RPC endpoints,
          private indexers, or internal network details.
        </p>
      </section>

      <section className="panel">
        <StatusPanel />
      </section>
    </>
  );
}
