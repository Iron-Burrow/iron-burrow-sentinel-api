import { renderLayout } from "./layout.js";

export function renderStatusPage(): string {
  return renderLayout({
    title: "Status",
    active: "status",
    body: `<section class="page-heading">
      <p class="eyebrow">Status</p>
      <h1>Public service status</h1>
      <p class="lead">This page reports app/database health and demo coverage without revealing RPC endpoints, private indexers, or internal network details.</p>
    </section>

    <section class="panel">
      <button class="button" data-status-button type="button">Refresh status</button>
      <div class="result" data-status-result></div>
    </section>`
  });
}
