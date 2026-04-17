import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { exec, execLive } from "../lib/exec.js";
import { getRepoDir } from "./clone-repo.js";

export function deployWorker(
  projectName: string,
  databaseId: string,
  databaseName: string,
): string {
  const repoDir = getRepoDir();
  const workerDir = resolve(repoDir, "apps/worker");

  // Generate wrangler.toml with real values
  const wranglerToml = `name = "${projectName}"
main = "src/index.ts"
compatibility_date = "2025-01-10"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "${databaseName}"
database_id = "${databaseId}"

[triggers]
crons = ["*/5 * * * *"]
`;

  const tomlPath = resolve(workerDir, "wrangler.toml");
  writeFileSync(tomlPath, wranglerToml, "utf-8");
  console.log(`  \u2714 wrangler.toml を生成しました`);

  console.log("\n  Worker をデプロイ中...");
  const ok = execLive("npx wrangler deploy", { cwd: workerDir });

  if (!ok) {
    console.error("  \u274c Worker のデプロイに失敗しました。");
    console.error(`  手動で実行してください: cd ${workerDir} && npx wrangler deploy`);
    process.exit(1);
  }

  // Parse worker URL from wrangler deploy output or construct it
  const workerUrl = parseWorkerUrl(projectName);
  console.log(`  \u2714 Worker デプロイ完了: ${workerUrl}`);

  return workerUrl;
}

function parseWorkerUrl(projectName: string): string {
  // Try to get the URL from wrangler deployments
  const result = exec("npx wrangler deployments list --json", { silent: true });
  if (result.success) {
    try {
      const data = JSON.parse(result.stdout);
      if (data?.items?.[0]?.triggers) {
        for (const trigger of data.items[0].triggers) {
          if (trigger.type === "route" && trigger.pattern) {
            return `https://${trigger.pattern}`;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback: standard workers.dev URL
  // Try wrangler whoami to get subdomain
  const whoami = exec("npx wrangler whoami", { silent: true });
  if (whoami.success) {
    const subdomainMatch = whoami.stdout.match(/(\w+)\.workers\.dev/);
    if (subdomainMatch) {
      return `https://${projectName}.${subdomainMatch[1]}.workers.dev`;
    }
  }

  return `https://${projectName}.<your-subdomain>.workers.dev`;
}
