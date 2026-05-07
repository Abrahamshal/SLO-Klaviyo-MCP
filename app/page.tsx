import { headers } from "next/headers";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

const SOIK_LOGO =
  "https://sleeponitkids.com/cdn/shop/files/new-SOIK-logo.png?v=1632149120&width=200";

const GITHUB_URL = "https://github.com/Abrahamshal/SLO-Klaviyo-MCP";

async function getMcpUrl(): Promise<string> {
  if (process.env.PUBLIC_URL) return `${process.env.PUBLIC_URL.replace(/\/$/, "")}/mcp`;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/mcp`;
}

function KlaviyoMark() {
  return (
    <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16 4.5c-5.7 0-10.7 3.3-13.1 8.1a1 1 0 0 0 .4 1.3c5.7 3.4 8.6 5.6 11.9 10.5a1 1 0 0 0 1.6 0c3.3-4.9 6.2-7.1 11.9-10.5a1 1 0 0 0 .4-1.3C26.7 7.8 21.7 4.5 16 4.5Zm0 14.2a3.7 3.7 0 1 1 0-7.4 3.7 3.7 0 0 1 0 7.4Z"
      />
    </svg>
  );
}

function ShopifyMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.93 4.42c-.07 0-1.13.04-1.13.04s-.95-.92-1.05-1.02c-.1-.1-.3-.07-.37-.05l-.5.16c-.05-.16-.13-.36-.24-.55-.34-.65-.83-1-1.43-1h-.04c-.04 0-.08.01-.13.01-.02-.02-.04-.05-.06-.07-.26-.27-.59-.4-.99-.39-.77.02-1.54.58-2.16 1.57-.44.7-.78 1.57-.87 2.25-.89.27-1.51.46-1.52.47-.45.14-.46.16-.52.59-.04.32-1.21 9.4-1.21 9.4l9.36 1.62 4.06-1.01s-1.13-7.65-1.14-7.7c0-.05-.02-.08-.04-.11-.02-.04-.05-.06-.08-.08l-.04-.13ZM10.15 5.84l-1.06.33c-.01-.51-.07-1.21-.31-1.82.74.14 1.11.97 1.37 1.49Zm-1.74-.45c-.6.18-1.25.39-1.91.59.18-.69.53-1.38.96-1.83.16-.17.39-.36.66-.46.25.53.31 1.27.29 1.7Zm-.71-3c.21 0 .39.05.55.14-.25.13-.49.32-.71.55-.59.63-1.04 1.61-1.22 2.55l-1.51.47c.36-1.66 1.75-3.66 2.89-3.71Z"
      />
      <path fill="currentColor" d="m14.92 4.45-.01.01.01-.01-.74 9.32 4.06-.88-1.78-7.95s-.99-.27-1.54-.49Z" />
    </svg>
  );
}

export default async function Home() {
  const mcpUrl = await getMcpUrl();

  return (
    <main className="page">
      <div className="container">
        <header className="hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SOIK_LOGO} alt="Sleep On It Kids" className="brand-logo" />
          <h1>Klaviyo MCP</h1>
          <p className="tagline">
            A custom Model Context Protocol server that lets Claude manage Klaviyo templates,
            segments, lists, and flows — covering the gaps in the native connector.
          </p>
        </header>

        <section className="integrations">
          <span className="integrations-label">Connects</span>
          <span className="chip chip-klaviyo">
            <KlaviyoMark /> Klaviyo
          </span>
          <span className="integrations-divider">+</span>
          <span className="chip chip-shopify">
            <ShopifyMark /> Shopify
          </span>
          <span className="integrations-divider">→</span>
          <span className="chip chip-claude">Claude</span>
        </section>

        <section className="card">
          <h2>Add to Claude in 3 steps</h2>
          <ol className="steps">
            <li>
              <div className="step-num">1</div>
              <div>
                <div className="step-title">Open Claude</div>
                <div className="step-body">
                  In Claude Desktop or claude.ai, go to{" "}
                  <strong>Settings → Connectors → Add custom connector</strong>.
                </div>
              </div>
            </li>
            <li>
              <div className="step-num">2</div>
              <div>
                <div className="step-title">Paste this URL</div>
                <div className="url-row">
                  <code className="url">{mcpUrl}</code>
                  <CopyButton value={mcpUrl} />
                </div>
              </div>
            </li>
            <li>
              <div className="step-num">3</div>
              <div>
                <div className="step-title">Approve access</div>
                <div className="step-body">
                  You&apos;ll be redirected to a consent page. Enter the connector password and
                  click <strong>Approve</strong>. The 23 Klaviyo tools become available in Claude.
                </div>
              </div>
            </li>
          </ol>
        </section>

        <section className="tools">
          <h2>What&apos;s included</h2>
          <p className="tools-sub">23 tools across four resources, each exposing the full Klaviyo endpoint surface — filters, sorts, pagination, sparse fieldsets, and full request bodies.</p>
          <div className="tools-grid">
            <div className="tool-group">
              <h3>Templates</h3>
              <ul>
                <li>get_templates</li>
                <li>create_template</li>
                <li>update_template</li>
                <li>delete_template</li>
                <li>clone_template</li>
                <li>render_template</li>
              </ul>
            </div>
            <div className="tool-group">
              <h3>Segments</h3>
              <ul>
                <li>create_segment</li>
                <li>update_segment</li>
                <li>delete_segment</li>
              </ul>
            </div>
            <div className="tool-group">
              <h3>Lists</h3>
              <ul>
                <li>create_list</li>
                <li>update_list</li>
                <li>delete_list</li>
                <li>add_profiles_to_list</li>
                <li>remove_profiles_from_list</li>
                <li>get_list_profiles</li>
              </ul>
            </div>
            <div className="tool-group">
              <h3>Flows</h3>
              <ul>
                <li>create_flow</li>
                <li>update_flow_status</li>
                <li>update_flow_action</li>
                <li>delete_flow</li>
                <li>get_flow_action</li>
                <li>get_flow_message</li>
                <li>get_flow_actions</li>
                <li>get_flow_action_ids</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="foot">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            View on GitHub →
          </a>
        </footer>
      </div>

      <style>{`
        :root {
          --bg: #f7f7f5;
          --surface: #ffffff;
          --ink: #0c0c0d;
          --ink-2: #4a4a52;
          --ink-3: #86868b;
          --line: #e6e6e3;
          --accent: #0066ff;
          --klaviyo: #0a3d2a;
          --shopify: #5a8a3a;
          --claude: #cf6c44;
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
        .page {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          padding: 48px 20px 80px;
          line-height: 1.5;
        }
        .container {
          max-width: 760px;
          margin: 0 auto;
        }
        .hero {
          text-align: center;
          padding: 24px 0 32px;
        }
        .brand-logo {
          height: 64px;
          width: auto;
          margin: 0 auto 24px;
          display: block;
          image-rendering: -webkit-optimize-contrast;
        }
        h1 {
          font-size: 40px;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 0 0 12px;
        }
        .tagline {
          font-size: 17px;
          color: var(--ink-2);
          max-width: 540px;
          margin: 0 auto;
        }
        .integrations {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 20px 0 40px;
        }
        .integrations-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-3);
          margin-right: 8px;
        }
        .integrations-divider {
          color: var(--ink-3);
          font-size: 14px;
          padding: 0 4px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 14px;
          font-weight: 500;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 999px;
          color: var(--ink);
        }
        .chip-klaviyo { color: var(--klaviyo); border-color: rgba(10,61,42,0.18); }
        .chip-shopify { color: var(--shopify); border-color: rgba(90,138,58,0.22); }
        .chip-claude  { color: var(--claude);  border-color: rgba(207,108,68,0.22); }
        .card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
        }
        .card h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 24px;
        }
        .steps {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .steps li {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .step-num {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--ink);
          color: var(--surface);
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 600;
        }
        .step-title {
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .step-body {
          color: var(--ink-2);
          font-size: 14px;
        }
        .url-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .url {
          flex: 1;
          min-width: 240px;
          padding: 8px 12px;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 13px;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--ink);
          word-break: break-all;
        }
        .copy-btn {
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          background: var(--ink);
          color: var(--surface);
          border: 0;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .copy-btn:hover { opacity: 0.85; }
        .tools h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 32px 0 8px;
        }
        .tools-sub {
          color: var(--ink-2);
          font-size: 14px;
          margin: 0 0 20px;
        }
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }
        .tool-group {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px 20px;
        }
        .tool-group h3 {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-3);
          margin: 0 0 10px;
        }
        .tool-group ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .tool-group li {
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 12.5px;
          color: var(--ink);
          padding: 2px 0;
        }
        .foot {
          text-align: center;
          margin-top: 48px;
          font-size: 13px;
        }
        .foot a {
          color: var(--ink-2);
          text-decoration: none;
        }
        .foot a:hover { color: var(--ink); }
        @media (max-width: 600px) {
          h1 { font-size: 32px; }
          .card { padding: 24px 20px; }
        }
      `}</style>
    </main>
  );
}
