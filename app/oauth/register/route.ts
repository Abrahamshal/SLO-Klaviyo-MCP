import { NextRequest, NextResponse } from "next/server";
import { issueClientId } from "@/lib/storage";

export const dynamic = "force-dynamic";

type RegisterRequest = {
  redirect_uris?: unknown;
  client_name?: unknown;
};

export async function POST(req: NextRequest) {
  let body: RegisterRequest;
  try {
    body = (await req.json()) as RegisterRequest;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const redirect_uris = Array.isArray(body.redirect_uris)
    ? (body.redirect_uris as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  if (redirect_uris.length === 0) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "redirect_uris required" },
      { status: 400 },
    );
  }

  const client_name = typeof body.client_name === "string" ? body.client_name : undefined;

  // We only support public clients with PKCE (token_endpoint_auth_method=none).
  // The client_id itself is a signed JWT carrying redirect_uris — no storage needed.
  const client_id = await issueClientId({
    client_name,
    redirect_uris,
    token_endpoint_auth_method: "none",
  });
  const created_at = Math.floor(Date.now() / 1000);

  return NextResponse.json(
    {
      client_id,
      client_name,
      redirect_uris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
      client_id_issued_at: created_at,
    },
    { status: 201 },
  );
}
