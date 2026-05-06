import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type ToolModule = {
  register: (server: McpServer) => void;
};
