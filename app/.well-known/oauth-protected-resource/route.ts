import { NextResponse } from "next/server";
import { getPublicUrl } from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const issuer = getPublicUrl();
  return NextResponse.json({
    resource: `${issuer}/mcp`,
    authorization_servers: [issuer],
    scopes_supported: ["klaviyo"],
    bearer_methods_supported: ["header"],
  });
}
