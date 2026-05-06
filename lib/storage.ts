import { SignJWT, jwtVerify } from "jose";

const ISSUER = "slo-klaviyo-mcp";

let cachedKey: Uint8Array | null = null;
function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters");
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

async function sign(claims: Record<string, unknown>, expSeconds: number): Promise<string> {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${expSeconds}s`)
    .sign(getKey());
}

async function verify<T extends Record<string, unknown>>(
  jwt: string,
  expectedTyp: string,
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(jwt, getKey(), { issuer: ISSUER });
    if (payload.typ !== expectedTyp) return null;
    return payload as unknown as T;
  } catch {
    return null;
  }
}

// ---------- Registered client ----------
// The client_id IS a signed JWT, encoding its redirect_uris. No storage needed —
// re-verify the JWT on every authorize/token call.

export type RegisteredClient = {
  typ: "client";
  client_name?: string;
  redirect_uris: string[];
  token_endpoint_auth_method: "none" | "client_secret_post";
  iat: number;
};

const CLIENT_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

export async function issueClientId(
  client: Omit<RegisteredClient, "typ" | "iat">,
): Promise<string> {
  return sign({ typ: "client", ...client }, CLIENT_TTL_SECONDS);
}

export async function decodeClientId(client_id: string): Promise<RegisteredClient | null> {
  return verify<RegisteredClient>(client_id, "client");
}

// ---------- Auth code ----------
// PKCE binds the code to the original code_verifier, so an intercepted code is useless.

export type AuthCode = {
  typ: "code";
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope?: string;
};

const CODE_TTL_SECONDS = 60 * 5; // 5 minutes

export async function issueAuthCode(data: Omit<AuthCode, "typ">): Promise<string> {
  return sign({ typ: "code", ...data }, CODE_TTL_SECONDS);
}

export async function decodeAuthCode(code: string): Promise<AuthCode | null> {
  return verify<AuthCode>(code, "code");
}

// ---------- Access token ----------

export type AccessToken = {
  typ: "access";
  client_id: string;
  scope?: string;
};

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function issueAccessToken(data: Omit<AccessToken, "typ">): Promise<string> {
  return sign({ typ: "access", ...data }, ACCESS_TOKEN_TTL_SECONDS);
}

export async function decodeAccessToken(token: string): Promise<AccessToken | null> {
  return verify<AccessToken>(token, "access");
}
