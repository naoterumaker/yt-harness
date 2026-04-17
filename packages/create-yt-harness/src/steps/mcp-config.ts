import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

export function writeMcpConfig(workerUrl: string, apiKey: string): void {
  const mcpPath = resolve(process.cwd(), ".mcp.json");

  let config: Record<string, unknown> = {};

  if (existsSync(mcpPath)) {
    try {
      config = JSON.parse(readFileSync(mcpPath, "utf-8"));
      console.log("  既存の .mcp.json を検出。マージします。");
    } catch {
      console.log("  \u26a0  既存の .mcp.json の解析に失敗。新規作成します。");
    }
  }

  const mcpServers = (config.mcpServers as Record<string, unknown>) || {};

  mcpServers["yt-harness"] = {
    command: "npx",
    args: ["-y", "@yt-harness/mcp@latest"],
    env: {
      YT_HARNESS_API_URL: workerUrl,
      YT_HARNESS_API_KEY: apiKey,
    },
  };

  config.mcpServers = mcpServers;

  writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
  console.log(`  \u2714 .mcp.json を書き込みました: ${mcpPath}`);
}
