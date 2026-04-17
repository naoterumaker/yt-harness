import { resolve } from "node:path";
import { exec } from "../lib/exec.js";
import { getRepoDir } from "./clone-repo.js";

export function setSecrets(opts: {
  projectName: string;
  googleClientId: string;
  googleClientSecret: string;
  workerUrl: string;
  apiKey: string;
  encryptionKey: string;
}): string {
  const repoDir = getRepoDir();
  const workerDir = resolve(repoDir, "apps/worker");
  const redirectUri = `${opts.workerUrl}/api/auth/callback`;

  const secrets: Record<string, string> = {
    GOOGLE_CLIENT_ID: opts.googleClientId,
    GOOGLE_CLIENT_SECRET: opts.googleClientSecret,
    GOOGLE_REDIRECT_URI: redirectUri,
    ENCRYPTION_KEY: opts.encryptionKey,
    API_KEY: opts.apiKey,
  };

  console.log("\n  シークレットを設定中...");
  const secretsJson = JSON.stringify(secrets);

  // Use echo + pipe to pass secrets via stdin
  const result = exec(
    `echo '${secretsJson.replace(/'/g, "'\\''")}' | npx wrangler secret:bulk`,
    { cwd: workerDir, silent: true },
  );

  if (!result.success) {
    console.error("  \u274c シークレットの一括設定に失敗しました。個別に設定を試行中...");

    let allOk = true;
    for (const [key, value] of Object.entries(secrets)) {
      const r = exec(
        `echo '${value.replace(/'/g, "'\\''")}' | npx wrangler secret put ${key}`,
        { cwd: workerDir, silent: true },
      );
      if (r.success) {
        console.log(`  \u2714 ${key}`);
      } else {
        console.error(`  \u274c ${key}: ${r.stderr}`);
        allOk = false;
      }
    }

    if (!allOk) {
      console.error("\n  一部のシークレット設定に失敗しました。手動で設定してください:");
      console.error(`  cd ${workerDir}`);
      for (const key of Object.keys(secrets)) {
        console.error(`  echo '<value>' | npx wrangler secret put ${key}`);
      }
    }
  } else {
    console.log("  \u2714 全シークレットを設定しました:");
    console.log("    - GOOGLE_CLIENT_ID");
    console.log("    - GOOGLE_CLIENT_SECRET");
    console.log("    - GOOGLE_REDIRECT_URI");
    console.log("    - ENCRYPTION_KEY");
    console.log("    - API_KEY");
  }

  return redirectUri;
}
