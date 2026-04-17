import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { exec, execLive } from "../lib/exec.js";

const REPO_URL = "https://github.com/naoterumaker/yt-harness.git";

export function getRepoDir(): string {
  return resolve(homedir(), ".yt-harness");
}

export function cloneRepo(): void {
  const repoDir = getRepoDir();

  if (existsSync(resolve(repoDir, ".git"))) {
    console.log(`  ${repoDir} は既に存在します。最新に更新中...`);
    const pullOk = execLive("git pull --ff-only", { cwd: repoDir });
    if (!pullOk) {
      console.log("  \u26a0  git pull に失敗しましたが、既存のコードで続行します。");
    } else {
      console.log("  \u2714 リポジトリを更新しました");
    }
  } else {
    console.log(`  リポジトリをクローン中... -> ${repoDir}`);
    const cloneOk = execLive(`git clone --depth 1 ${REPO_URL} "${repoDir}"`);
    if (!cloneOk) {
      console.error("  \u274c git clone に失敗しました。");
      console.error(`  手動で実行してください: git clone ${REPO_URL} ${repoDir}`);
      process.exit(1);
    }
    console.log("  \u2714 クローン完了");
  }

  console.log("\n  依存関係をインストール中... (pnpm install)");
  const installOk = execLive("pnpm install --frozen-lockfile", { cwd: repoDir });
  if (!installOk) {
    // fallback without frozen lockfile
    console.log("  frozen-lockfile で失敗。通常のインストールを試行中...");
    const retryOk = execLive("pnpm install", { cwd: repoDir });
    if (!retryOk) {
      console.error("  \u274c pnpm install に失敗しました。");
      console.error(`  手動で実行してください: cd ${repoDir} && pnpm install`);
      process.exit(1);
    }
  }
  console.log("  \u2714 依存関係のインストール完了");
}
