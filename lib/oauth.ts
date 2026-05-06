import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { decodeAccessToken } from "./storage";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  const hash = createHash("sha256").update(verifier).digest();
  const expected = hash.toString("base64url");
  if (expected.length !== challenge.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(challenge));
}

export function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function getPublicUrl(): string {
  const url = process.env.PUBLIC_URL;
  if (!url) throw new Error("PUBLIC_URL is not set");
  return url.replace(/\/$/, "");
}

export function getConnectorPassword(): string {
  const pw = process.env.CONNECTOR_PASSWORD;
  if (!pw) throw new Error("CONNECTOR_PASSWORD is not set");
  return pw;
}

export type BearerCheck =
  | { ok: true; clientId: string; scope?: string }
  | { ok: false; status: number; reason: string };

export async function validateBearer(req: Request): Promise<BearerCheck> {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, reason: "missing_bearer" };
  }
  const token = header.slice(7).trim();
  if (!token) return { ok: false, status: 401, reason: "empty_token" };

  const claims = await decodeAccessToken(token);
  if (!claims) return { ok: false, status: 401, reason: "invalid_token" };

  return { ok: true, clientId: claims.client_id, scope: claims.scope };
}

export function unauthorizedResponse(reason: string): Response {
  const publicUrl = getPublicUrl();
  return new Response(JSON.stringify({ error: "unauthorized", error_description: reason }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer realm="mcp", resource_metadata="${publicUrl}/.well-known/oauth-protected-resource", error="invalid_token"`,
    },
  });
}
