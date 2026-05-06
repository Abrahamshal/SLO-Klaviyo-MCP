import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { templates } from "./templates";
import { segments } from "./segments";
import { lists } from "./lists";
import { flows } from "./flows";

export function registerAllTools(server: McpServer): void {
  templates.register(server);
  segments.register(server);
  lists.register(server);
  flows.register(server);
}
