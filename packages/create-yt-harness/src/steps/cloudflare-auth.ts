import { exec, execLive, commandExists } from "../lib/exec.js";

export function cloudflareAuth(): void {
  console.log("\n  wrangler を確認中...");

  if (!commandExists("wrangler")) {
    // Try npx wrangler
    const npxResult = exec("npx wrangler --version", { silent: true });
    if (!npxResult.success) {
      console.error("  \u274c wrangler が見つかりません。");
      console.error("  インストール: npm install -g wrangler");
      process.exit(1);
    }
  }

  const versionResult = exec("npx wrangler --version", { silent: true });
  if (versionResult.success) {
    console.log(`  wrangler ${versionResult.stdout.split("\n")[0]} を検出`);
  }

  console.log("\n  Cloudflare ログイン状態を確認中...");
  const whoami = exec("npx wrangler whoami", { silent: true });

  if (!whoami.success || whoami.stdout.includes("not authenticated")) {
    console.log("  Cloudflare にログインが必要です。ブラウザが開きます...\n");
    const loginOk = execLive("npx wrangler login");
    if (!loginOk) {
      console.error("  \u274c wrangler login に失敗しました。");
      console.error("  手動で実行してください: npx wrangler login");
      process.exit(1);
    }
    console.log("  \u2714 Cloudflare にログインしました");
  } else {
    // Extract account info
    const lines = whoami.stdout.split("\n");
    for (const line of lines) {
      if (line.includes("|") && !line.includes("Account Name")) {
        console.log(`  \u2714 ログイン済み: ${line.trim()}`);
        break;
      }
    }
    if (!lines.some((l) => l.includes("|"))) {
      console.log("  \u2714 Cloudflare にログイン済みです");
    }
  }
}
