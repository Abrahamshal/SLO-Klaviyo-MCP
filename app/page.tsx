export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 32, maxWidth: 640 }}>
      <h1>SLO Klaviyo MCP</h1>
      <p>
        This is a remote MCP server. There is no UI here. Add it as a custom connector in
        Claude (Settings &rarr; Connectors &rarr; Add custom connector) using the URL{" "}
        <code>/mcp</code> on this domain.
      </p>
    </main>
  );
}
