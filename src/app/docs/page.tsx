import type { Metadata } from "next";

export const metadata: Metadata = { title: "Docs" };

const ROUTES: Array<{ method: string; path: string; auth: string }> = [
  { method: "GET", path: "/v1/status", auth: "No" },
  { method: "GET", path: "/v1/sources", auth: "No" },
  { method: "GET", path: "/api/public/resolve?q=mBURROW", auth: "No" },
  { method: "GET", path: "/api/public/assets/:slug", auth: "No" },
  { method: "GET", path: "/api/public/mantle/assets/:address", auth: "No" },
  { method: "POST", path: "/v1/api-keys", auth: "No" },
  { method: "GET", path: "/v1/me", auth: "Yes" },
  { method: "GET", path: "/v1/me/usage", auth: "Yes" },
  { method: "GET", path: "/v1/api-keys", auth: "Yes" },
  { method: "DELETE", path: "/v1/api-keys/:id", auth: "Yes" },
  { method: "GET", path: "/v1/mantle/assets/:address/summary", auth: "Yes" },
  { method: "GET", path: "/v1/mantle/assets/:address/holders", auth: "Yes" },
  { method: "GET", path: "/v1/mantle/assets/:address/concentration", auth: "Yes" },
  { method: "GET", path: "/v1/mantle/signals/liquidity-delta", auth: "Yes" },
  { method: "GET", path: "/v1/prices/latest?symbol=BTC", auth: "Yes" },
  { method: "GET", path: "/v1/prices/series?symbol=BTC&range=7d", auth: "Yes" },
  { method: "GET", path: "/v1/prices/history?symbol=BTC", auth: "Yes" },
  { method: "POST", path: "/v1/query", auth: "Yes" },
];

export default function DocsPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Docs</p>
        <h1 className="h-title">Sentinel API quick reference</h1>
        <p className="lead">
          Use API keys for account and Mantle intelligence routes. Public status, source, search,
          and asset UI support routes are available without a key.
        </p>
      </section>

      <section className="panel">
        <h2 className="h-sub">Protected request</h2>
        <pre>
          <code>{`curl -H "Authorization: Bearer ibs_test_your_key" \\
  http://localhost:3000/v1/mantle/assets/0x1111111111111111111111111111111111111111/summary`}</code>
        </pre>
      </section>

      <section className="panel table-panel">
        <h2 className="h-sub">Routes</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Auth</th>
            </tr>
          </thead>
          <tbody>
            {ROUTES.map((route) => (
              <tr key={`${route.method} ${route.path}`}>
                <td>{route.method}</td>
                <td>{route.path}</td>
                <td>{route.auth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
