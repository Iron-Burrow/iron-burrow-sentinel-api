import { renderLayout } from "./layout.js";

export function renderDocsPage(): string {
  return renderLayout({
    title: "Docs",
    active: "docs",
    body: `<section class="page-heading">
      <p class="eyebrow">Docs</p>
      <h1>Sentinel API quick reference</h1>
      <p class="lead">Use API keys for account and Mantle intelligence routes. Public status and source routes are available without a key.</p>
    </section>

    <section class="panel">
      <h2>Protected request</h2>
      <pre><code>curl -H "Authorization: Bearer ibs_test_your_key" \\
  http://localhost:3000/v1/mantle/assets/0x1111111111111111111111111111111111111111/summary</code></pre>
    </section>

    <section class="panel table-panel">
      <h2>Routes</h2>
      <table>
        <thead><tr><th>Method</th><th>Path</th><th>Auth</th></tr></thead>
        <tbody>
          <tr><td>GET</td><td>/v1/status</td><td>No</td></tr>
          <tr><td>GET</td><td>/v1/sources</td><td>No</td></tr>
          <tr><td>POST</td><td>/v1/api-keys</td><td>No</td></tr>
          <tr><td>GET</td><td>/v1/me</td><td>Yes</td></tr>
          <tr><td>GET</td><td>/v1/me/usage</td><td>Yes</td></tr>
          <tr><td>GET</td><td>/v1/api-keys</td><td>Yes</td></tr>
          <tr><td>DELETE</td><td>/v1/api-keys/:id</td><td>Yes</td></tr>
          <tr><td>GET</td><td>/v1/mantle/assets/:address/summary</td><td>Yes</td></tr>
          <tr><td>GET</td><td>/v1/mantle/assets/:address/holders</td><td>Yes</td></tr>
          <tr><td>GET</td><td>/v1/mantle/assets/:address/concentration</td><td>Yes</td></tr>
          <tr><td>GET</td><td>/v1/mantle/signals/liquidity-delta</td><td>Yes</td></tr>
          <tr><td>POST</td><td>/v1/query</td><td>Yes</td></tr>
        </tbody>
      </table>
    </section>`
  });
}
