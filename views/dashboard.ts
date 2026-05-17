import { renderLayout } from "./layout.js";

export function renderDashboardPage(): string {
  return renderLayout({
    title: "Dashboard",
    active: "dashboard",
    body: `<section class="page-heading">
      <p class="eyebrow">Dashboard</p>
      <h1>Sentinel workspace</h1>
      <p class="lead">A compact public control surface for creating keys, checking status, reading docs, and testing the Mantle demo API.</p>
    </section>

    <section class="grid two">
      <a class="panel link-panel" href="/api-keys">
        <h2>API keys</h2>
        <p>Create a hackathon key, then store it somewhere safe. Sentinel only shows it once.</p>
      </a>
      <a class="panel link-panel" href="/usage">
        <h2>Usage</h2>
        <p>Inspect recent API calls, cost units, and request status after you start calling protected routes.</p>
      </a>
      <a class="panel link-panel" href="/mantle-demo">
        <h2>Mantle demo</h2>
        <p>Preview the exact source-aware payload shapes exposed to agents.</p>
      </a>
      <a class="panel link-panel" href="/status">
        <h2>Status</h2>
        <p>Confirm app and database health without leaking private infrastructure details.</p>
      </a>
    </section>`
  });
}
