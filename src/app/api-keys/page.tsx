import type { Metadata } from "next";

import { ApiKeyForm } from "@/components/account/api-key-form";

export const metadata: Metadata = { title: "API Keys" };

export default function ApiKeysPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Serve yourself</p>
        <h1 className="h-title">Create an API key</h1>
        <p className="lead">
          Keys are generated once and stored hashed. After creation, Sentinel only remembers the
          prefix.
        </p>
      </section>

      <section className="panel">
        <ApiKeyForm />
      </section>

      <section className="panel">
        <h2 className="h-sub">Use it</h2>
        <pre>
          <code>{`curl -H "Authorization: Bearer ibs_test_your_key" \\
  http://localhost:3000/v1/me`}</code>
        </pre>
      </section>
    </>
  );
}
