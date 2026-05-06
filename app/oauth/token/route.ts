import { NextRequest, NextResponse } from "next/server";
import { verifyPkce } from "@/lib/oauth";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  decodeAuthCode,
  decodeClientId,
  issueAccessToken,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

function err(error: string, description?: string, status = 400): NextResponse {
  return NextResponse.json(
    description ? { error, error_description: description } : { error },
    { status, headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
  );
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";
  let form: URLSearchParams;
  if (ct.includes("application/x-www-form-urlencoded")) {
    form = new URLSearchParams(await req.text());
  } else if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    form = new URLSearchParams();
    for (const [k, v] of fd.entries()) form.set(k, String(v));
  } else {
    return err("invalid_request", "unsupported content-type");
  }

  const grant_type = form.get("grant_type");
  if (grant_type !== "authorization_code") {
    return err("unsupported_grant_type");
  }

  const code = form.get("code");
  const redirect_uri = form.get("redirect_uri");
  const client_id = form.get("client_id");
  const code_verifier = form.get("code_verifier");

  if (!code || !redirect_uri || !client_id || !code_verifier) {
    return err("invalid_request", "missing required parameter");
  }

  const client = await decodeClientId(client_id);
  if (!client) return err("invalid_client", undefined, 401);

  const authCode = await decodeAuthCode(code);
  if (!authCode) return err("invalid_grant", "code invalid or expired");
  if (authCode.client_id !== client_id) return err("invalid_grant", "client mismatch");
  if (authCode.redirect_uri !== redirect_uri) return err("invalid_grant", "redirect_uri mismatch");
  if (!verifyPkce(code_verifier, authCode.code_challenge)) {
    return err("invalid_grant", "pkce verification failed");
  }

  const access_token = await issueAccessToken({
    client_id,
    scope: authCode.scope,
  });

  return NextResponse.json(
    {
      access_token,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      scope: authCode.scope,
    },
    { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
  );
}
