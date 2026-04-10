import type { YTHarnessClient } from "./client.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (client: YTHarnessClient, args: Record<string, unknown>) => Promise<unknown>;
}
