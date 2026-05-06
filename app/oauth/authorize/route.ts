import { NextRequest, NextResponse } from "next/server";
import { constantTimeEquals, getConnectorPassword } from "@/lib/oauth";
import { decodeClientId, issueAuthCode } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AuthorizeParams = {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string;
  scope?: string;
};

function readParams(searchParams: URLSearchParams): AuthorizeParams | null {
  const response_type = searchParams.get("response_type");
  const client_id = searchParams.get("client_id");
  const redirect_uri = searchParams.get("redirect_uri");
  const code_challenge = searchParams.get("code_challenge");
  const code_challenge_method = searchParams.get("code_challenge_method");
  if (!response_type || !client_id || !redirect_uri || !code_challenge || !code_challenge_method) {
    return null;
  }
  return {
    response_type,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    state: searchParams.get("state") ?? undefined,
    scope: searchParams.get("scope") ?? undefined,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderConsentPage(params: AuthorizeParams, error?: string): string {
  const fields: [string, string | undefined][] = [
    ["response_type", params.response_type],
    ["client_id", params.client_id],
    ["redirect_uri", params.redirect_uri],
    ["code_challenge", params.code_challenge],
    ["code_challenge_method", params.code_challenge_method],
    ["state", params.state],
    ["scope", params.scope],
  ];
  const hidden = fields
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${escapeHtml(v as string)}" />`)
    .join("\n      ");

  const errorBlock = error
    ? `<p style="color:#b00020;margin:0 0 12px 0;font-size:14px;">${escapeHtml(error)}</p>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Authorize Klaviyo MCP</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         background:#f5f5f7; margin:0; padding:0; color:#1d1d1f; }
  .wrap { max-width:420px; margin:8vh auto; background:#fff; padding:32px; border-radius:12px;
          box-shadow:0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05); }
  h1 { font-size:20px; margin:0 0 8px 0; }
  p.lede { color:#5f5f63; font-size:14px; margin:0 0 20px 0; line-height:1.5; }
  label { display:block; font-size:13px; color:#1d1d1f; margin-bottom:6px; font-weight:500; }
  input[type=password] { width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px;
                         border:1px solid #d2d2d7; border-radius:8px; outline:none; }
  input[type=password]:focus { border-color:#0066ff; }
  button { width:100%; margin-top:16px; padding:10px 16px; font-size:14px; font-weight:600;
           background:#0066ff; color:#fff; border:0; border-radius:8px; cursor:pointer; }
  button:hover { background:#0052cc; }
  .muted { color:#86868b; font-size:12px; margin-top:16px; text-align:center; word-break:break-all; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Authorize Klaviyo MCP</h1>
    <p class="lede">Grant Claude access to your Klaviyo MCP server. Enter the connector password to continue.</p>
    ${errorBlock}
    <form method="POST" action="/oauth/authorize">
      ${hidden}
      <label for="password">Connector password</label>
      <input id="password" name="password" type="password" autocomplete="off" autofocus required />
      <button type="submit">Approve</button>
    </form>
  </div>
</body>
</html>`;
}

async function validateClientAndRedirect(
  client_id: string,
  redirect_uri: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = await decodeClientId(client_id);
  if (!client) return { ok: false, error: "invalid_client" };
  if (!client.redirect_uris.includes(redirect_uri)) {
    return { ok: false, error: "invalid_redirect_uri" };
  }
  return { ok: true };
}

export async function GET(req: NextRequest) {
  const params = readParams(req.nextUrl.searchParams);
  if (!params) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (params.response_type !== "code") {
    return NextResponse.json({ error: "unsupported_response_type" }, { status: 400 });
  }
  if (params.code_challenge_method !== "S256") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "S256 required" },
      { status: 400 },
    );
  }

  const check = await validateClientAndRedirect(params.client_id, params.redirect_uri);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  return new Response(renderConsentPage(params), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const params: AuthorizeParams = {
    response_type: String(form.get("response_type") ?? ""),
    client_id: String(form.get("client_id") ?? ""),
    redirect_uri: String(form.get("redirect_uri") ?? ""),
    code_challenge: String(form.get("code_challenge") ?? ""),
    code_challenge_method: String(form.get("code_challenge_method") ?? ""),
    state: form.get("state") ? String(form.get("state")) : undefined,
    scope: form.get("scope") ? String(form.get("scope")) : undefined,
  };
  const password = String(form.get("password") ?? "");

  if (!params.client_id || !params.redirect_uri || !params.code_challenge) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const check = await validateClientAndRedirect(params.client_id, params.redirect_uri);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  if (!constantTimeEquals(password, getConnectorPassword())) {
    return new Response(renderConsentPage(params, "Incorrect password."), {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const code = await issueAuthCode({
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    code_challenge: params.code_challenge,
    scope: params.scope,
  });

  const redirect = new URL(params.redirect_uri);
  redirect.searchParams.set("code", code);
  if (params.state) redirect.searchParams.set("state", params.state);

  return NextResponse.redirect(redirect.toString(), { status: 302 });
}
