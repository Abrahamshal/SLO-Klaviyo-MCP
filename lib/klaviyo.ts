const BASE_URL = "https://a.klaviyo.com";

function getApiKey(): string {
  const key = process.env.KLAVIYO_API_KEY;
  if (!key) throw new Error("KLAVIYO_API_KEY is not set");
  return key;
}

function getRevision(): string {
  return process.env.KLAVIYO_API_REVISION ?? "2026-04-15";
}

export class KlaviyoError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`Klaviyo API error ${status}: ${JSON.stringify(body)}`);
    this.status = status;
    this.body = body;
  }
}

type RequestOpts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

export async function klaviyoFetch<T = unknown>(
  path: string,
  opts: RequestOpts = {},
): Promise<T> {
  const { method = "GET", query, body } = opts;

  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Klaviyo-API-Key ${getApiKey()}`,
    Accept: "application/vnd.api+json",
    revision: getRevision(),
  };
  if (body !== undefined) headers["Content-Type"] = "application/vnd.api+json";

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? safeJson(text) : undefined;

  if (!res.ok) throw new KlaviyoError(res.status, parsed ?? text);

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
