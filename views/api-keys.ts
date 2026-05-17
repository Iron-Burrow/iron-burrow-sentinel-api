import { renderLayout } from "./layout.js";

export function renderApiKeysPage(): string {
  return renderLayout({
    title: "API Keys",
    active: "keys",
    body: `<section class="page-heading">
      <p class="eyebrow">Serve yourself</p>
      <h1>Create an API key</h1>
      <p class="lead">Keys are generated once and stored hashed. After creation, Sentinel only remembers the prefix.</p>
    </section>

    <section class="panel">
      <form class="form" data-create-key-form>
        <label>
          Email
          <input name="email" type="email" placeholder="builder@example.com" required />
        </label>
        <label>
          Name
          <input name="name" type="text" placeholder="Hackathon Builder" required />
        </label>
        <label>
          Key name
          <input name="keyName" type="text" placeholder="Demo key" />
        </label>
        <button class="button" type="submit">Generate key</button>
      </form>
      <div class="result" data-key-result hidden></div>
    </section>

    <section class="panel">
      <h2>Use it</h2>
      <pre><code>curl -H "Authorization: Bearer ibs_test_your_key" \\
  http://localhost:3000/v1/me</code></pre>
    </section>`
  });
}
