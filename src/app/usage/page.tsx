import type { Metadata } from "next";

import { UsageForm } from "@/components/account/usage-form";

export const metadata: Metadata = { title: "Usage" };

export default function UsagePage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Usage</p>
        <h1 className="h-title">Inspect API usage</h1>
        <p className="lead">
          Paste an API key locally in your browser to fetch recent request logs. The key is not
          stored by this page.
        </p>
      </section>

      <section className="panel">
        <UsageForm />
      </section>
    </>
  );
}
