import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { exec, execLive } from "../lib/exec.js";
import { getRepoDir } from "./clone-repo.js";

export function deployAdmin(projectName: string, workerUrl: string): string {
  const repoDir = getRepoDir();
  const adminDir = resolve(repoDir, "apps/admin");

  if (!existsSync(adminDir)) {
    console.log("  \u26a0  admin アプリが見つかりません。スキップします。");
    return "";
  }

  console.log("\n  Admin UI をビルド中...");

  // Install deps if needed
  if (!existsSync(resolve(adminDir, "node_modules"))) {
    execLive("pnpm install", { cwd: adminDir });
  }

  // Build with environment variable
  const buildOk = execLive(
    `NEXT_PUBLIC_API_URL=${workerUrl} pnpm build`,
    { cwd: adminDir },
  );

  if (!buildOk) {
    console.error("  \u274c Admin UI のビルドに失敗しました。");
    console.error("  手動で実行してください:");
    console.error(`  cd ${adminDir}`);
    console.error(`  NEXT_PUBLIC_API_URL=${workerUrl} pnpm build`);
    console.error(`  npx wrangler pages deploy out --project-name=${projectName}-admin`);
    return "";
  }

  console.log("\n  Cloudflare Pages にデプロイ中...");

  // Detect build output dir (Next.js static export or out)
  let outDir = "out";
  if (existsSync(resolve(adminDir, ".next/standalone"))) {
    outDir = ".next/standalone";
  }

  const pagesName = `${projectName}-admin`;
  const deployOk = execLive(
    `npx wrangler pages deploy ${outDir} --project-name=${pagesName}`,
    { cwd: adminDir },
  );

  if (!deployOk) {
    console.error("  \u274c Pages デプロイに失敗しました。");
    console.error(`  手動で実行: cd ${adminDir} && npx wrangler pages deploy ${outDir} --project-name=${pagesName}`);
    return "";
  }

  // Parse pages URL
  const pagesUrl = parsePagesUrl(pagesName);
  console.log(`  \u2714 Admin UI デプロイ完了: ${pagesUrl}`);
  return pagesUrl;
}

function parsePagesUrl(pagesName: string): string {
  const result = exec(`npx wrangler pages project list --json`, { silent: true });
  if (result.success) {
    try {
      const projects = JSON.parse(result.stdout);
      const project = projects.find((p: { name: string }) => p.name === pagesName);
      if (project?.subdomain) {
        return `https://${project.subdomain}`;
      }
    } catch {
      // ignore
    }
  }
  return `https://${pagesName}.pages.dev`;
}
