import { createMcpHandler } from "mcp-handler";
import { registerAllTools } from "@/lib/tools";
import { unauthorizedResponse, validateBearer } from "@/lib/oauth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    registerAllTools(server);
  },
  {
    serverInfo: {
      name: "slo-klaviyo-mcp",
      version: "0.1.0",
    },
  },
  {
    basePath: "",
    verboseLogs: false,
    // redisUrl is auto-read from REDIS_URL or KV_URL (set by Vercel's Upstash integration).
  },
);

async function withAuth(req: Request): Promise<Response> {
  const auth = await validateBearer(req);
  if (!auth.ok) return unauthorizedResponse(auth.reason);
  return handler(req);
}

export { withAuth as GET, withAuth as POST, withAuth as DELETE };
