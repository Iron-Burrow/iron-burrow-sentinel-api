import { renderLayout } from "./layout.js";

export function renderUsagePage(): string {
  return renderLayout({
    title: "Usage",
    active: "usage",
    body: `<section class="page-heading">
      <p class="eyebrow">Usage</p>
      <h1>Inspect API usage</h1>
      <p class="lead">Paste an API key locally in your browser to fetch recent request logs. The key is not stored by this page.</p>
    </section>

    <section class="panel">
      <form class="form inline" data-usage-form>
        <label>
          API key
          <input name="apiKey" type="password" placeholder="ibs_test_..." required />
        </label>
        <button class="button" type="submit">Load usage</button>
      </form>
      <div class="result" data-usage-result hidden></div>
    </section>`
  });
}
