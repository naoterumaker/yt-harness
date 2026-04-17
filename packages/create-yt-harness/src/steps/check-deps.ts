import { exec, commandExists } from "../lib/exec.js";

export function checkDeps(): void {
  console.log("\n  Node.js バージョンを確認中...");

  const nodeResult = exec("node --version", { silent: true });
  if (!nodeResult.success) {
    console.error("  \u274c Node.js が見つかりません。v20以上をインストールしてください。");
    process.exit(1);
  }

  const version = nodeResult.stdout.replace("v", "");
  const major = parseInt(version.split(".")[0], 10);
  console.log(`  Node.js ${nodeResult.stdout} を検出`);

  if (major < 20) {
    console.error(`  \u274c Node.js v20以上が必要です（現在: v${version}）`);
    console.error("  https://nodejs.org/ から最新版をインストールしてください。");
    process.exit(1);
  }
  console.log("  \u2714 Node.js >= 20 OK");

  console.log("\n  pnpm を確認中...");
  if (!commandExists("pnpm")) {
    console.error("  \u274c pnpm が見つかりません。");
    console.error("  インストール: npm install -g pnpm");
    process.exit(1);
  }

  const pnpmResult = exec("pnpm --version", { silent: true });
  console.log(`  pnpm ${pnpmResult.stdout} を検出`);
  console.log("  \u2714 pnpm OK");

  console.log("\n  git を確認中...");
  if (!commandExists("git")) {
    console.error("  \u274c git が見つかりません。");
    process.exit(1);
  }
  console.log("  \u2714 git OK");
}
