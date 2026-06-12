import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

const LINK_PANELS: Array<{ href: string; title: string; body: string }> = [
  {
    href: "/api-keys",
    title: "API keys",
    body: "Create a hackathon key, then store it somewhere safe. Sentinel only shows it once.",
  },
  {
    href: "/usage",
    title: "Usage",
    body: "Inspect recent API calls, cost units, and request status after you start calling protected routes.",
  },
  {
    href: "/mantle-demo",
    title: "Mantle demo",
    body: "Preview the exact source-aware payload shapes exposed to agents.",
  },
  {
    href: "/status",
    title: "Status",
    body: "Confirm app and database health without leaking private infrastructure details.",
  },
];

export default function DashboardPage() {
  return (
    <>
      <section className="page-heading">
        <p className="eyebrow">Dashboard</p>
        <h1 className="h-title">Sentinel workspace</h1>
        <p className="lead">
          A compact public control surface for creating keys, checking status, reading docs, and
          testing the Mantle demo API.
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Search</p>
            <h2 className="h-sub">Resolve public Mantle intelligence</h2>
          </div>
        </div>
        <form className="search-card" action="/search" method="get">
          <label htmlFor="workspace-search">Canonical asset, symbol, name, or Mantle address</label>
          <div className="search-row">
            <input
              id="workspace-search"
              name="q"
              placeholder="mBURROW or 0x1111111111111111111111111111111111111111"
            />
            <button className="button" type="submit">
              Resolve
            </button>
          </div>
        </form>
      </section>

      <section className="grid two">
        {LINK_PANELS.map((panel) => (
          <a key={panel.href} className="panel link-panel" href={panel.href}>
            <h2 className="h-sub">{panel.title}</h2>
            <p>{panel.body}</p>
          </a>
        ))}
      </section>
    </>
  );
}
