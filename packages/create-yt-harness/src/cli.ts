import { loadState, saveState, clearState } from "./lib/state.js";
import { generateApiKey, generateEncryptionKey } from "./lib/crypto.js";
import { closePrompt, prompt } from "./lib/prompt.js";

import { checkDeps } from "./steps/check-deps.js";
import { cloneRepo } from "./steps/clone-repo.js";
import { cloudflareAuth } from "./steps/cloudflare-auth.js";
import { googleCredentials } from "./steps/google-credentials.js";
import { getProjectName } from "./steps/project-name.js";
import { createDatabase, migrateSchema } from "./steps/database.js";
import { deployWorker } from "./steps/deploy-worker.js";
import { setSecrets } from "./steps/secrets.js";
import { deployAdmin } from "./steps/deploy-admin.js";
import { writeMcpConfig } from "./steps/mcp-config.js";
import { printComplete } from "./steps/complete.js";

const VERSION = "0.1.0";

const STEPS = [
  "welcome",
  "check-deps",
  "clone-repo",
  "cloudflare-auth",
  "google-credentials",
  "project-name",
  "database",
  "schema",
  "deploy-worker",
  "secrets",
  "oauth-redirect",
  "oauth-authorize",
  "deploy-admin",
  "mcp-config",
  "complete",
] as const;

type Step = (typeof STEPS)[number];

function stepIndex(step: Step): number {
  return STEPS.indexOf(step);
}

function printBanner(): void {
  console.log(`
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551                                                  \u2551
\u2551         YT Harness  \u2014  \u30ef\u30f3\u30b3\u30de\u30f3\u30c9\u30bb\u30c3\u30c8\u30a2\u30c3\u30d7       \u2551
\u2551                                                  \u2551
\u2551   YouTube \u30c1\u30e3\u30f3\u30cd\u30eb\u81ea\u52d5\u5316 \u00d7 Cloudflare Workers     \u2551
\u2551   v${VERSION}                                        \u2551
\u2551                                                  \u2551
\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d
`);
}

function printStepHeader(n: number, total: number, title: string): void {
  console.log(`\n${"─".repeat(56)}`);
  console.log(`  [${n}/${total}] ${title}`);
  console.log(`${"─".repeat(56)}`);
}

export async function run(): Promise<void> {
  const state = loadState();
  const resumeStep = (state.step as Step) || "welcome";
  const resumeIdx = stepIndex(resumeStep);
  const total = STEPS.length - 1; // exclude "complete" from count

  try {
    // ── Step 1: Welcome ──
    if (resumeIdx <= stepIndex("welcome")) {
      printBanner();
      if (resumeIdx > 0) {
        console.log(`  \u21bb \u30b9\u30c6\u30c3\u30d7 "${resumeStep}" \u304b\u3089\u518d\u958b\u3057\u307e\u3059...\n`);
      }
      console.log("  \u3053\u306e\u30c4\u30fc\u30eb\u306f YT Harness \u306e\u30bb\u30c3\u30c8\u30a2\u30c3\u30d7\u3092\u5168\u81ea\u52d5\u3067\u884c\u3044\u307e\u3059\u3002");
      console.log("  \u5fc5\u8981\u306a\u3082\u306e:");
      console.log("    - Google Cloud \u30d7\u30ed\u30b8\u30a7\u30af\u30c8 (YouTube API)");
      console.log("    - Cloudflare \u30a2\u30ab\u30a6\u30f3\u30c8");
      console.log("    - Node.js >= 20, pnpm, git");
      saveState({ step: "check-deps" });
    } else {
      printBanner();
      console.log(`  \u21bb \u30b9\u30c6\u30c3\u30d7 "${resumeStep}" \u304b\u3089\u518d\u958b\u3057\u307e\u3059...\n`);
    }

    // ── Step 2: Check deps ──
    if (resumeIdx <= stepIndex("check-deps")) {
      printStepHeader(1, total, "\u4f9d\u5b58\u95a2\u4fc2\u306e\u78ba\u8a8d");
      checkDeps();
      saveState({ step: "clone-repo" });
    }

    // ── Step 3: Clone repo ──
    if (resumeIdx <= stepIndex("clone-repo")) {
      printStepHeader(2, total, "\u30ea\u30dd\u30b8\u30c8\u30ea\u306e\u53d6\u5f97");
      cloneRepo();
      saveState({ step: "cloudflare-auth" });
    }

    // ── Step 4: Cloudflare auth ──
    if (resumeIdx <= stepIndex("cloudflare-auth")) {
      printStepHeader(3, total, "Cloudflare \u30ed\u30b0\u30a4\u30f3");
      cloudflareAuth();
      saveState({ step: "google-credentials" });
    }

    // ── Step 5: Google credentials ──
    if (resumeIdx <= stepIndex("google-credentials")) {
      printStepHeader(4, total, "Google Cloud \u8a8d\u8a3c\u60c5\u5831");
      const { clientId, clientSecret } = await googleCredentials(state);
      saveState({
        step: "project-name",
        googleClientId: clientId,
        googleClientSecret: clientSecret,
      });
      state.googleClientId = clientId;
      state.googleClientSecret = clientSecret;
    }

    // ── Step 6: Project name ──
    if (resumeIdx <= stepIndex("project-name")) {
      printStepHeader(5, total, "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u540d");
      const projectName = await getProjectName(state.projectName);
      saveState({ step: "database", projectName });
      state.projectName = projectName;
    }

    // ── Step 7: Database ──
    if (resumeIdx <= stepIndex("database")) {
      printStepHeader(6, total, "D1 \u30c7\u30fc\u30bf\u30d9\u30fc\u30b9\u4f5c\u6210");
      const { databaseId, databaseName } = createDatabase(
        state.projectName!,
        state.databaseId,
      );
      saveState({ step: "schema", databaseId, databaseName });
      state.databaseId = databaseId;
      state.databaseName = databaseName;
    }

    // ── Step 8: Schema migration ──
    if (resumeIdx <= stepIndex("schema")) {
      printStepHeader(7, total, "\u30b9\u30ad\u30fc\u30de\u30de\u30a4\u30b0\u30ec\u30fc\u30b7\u30e7\u30f3");
      migrateSchema(state.databaseName!);
      saveState({ step: "deploy-worker" });
    }

    // ── Step 9: Deploy worker ──
    if (resumeIdx <= stepIndex("deploy-worker")) {
      printStepHeader(8, total, "Worker \u30c7\u30d7\u30ed\u30a4");
      const workerUrl = deployWorker(
        state.projectName!,
        state.databaseId!,
        state.databaseName!,
      );
      saveState({ step: "secrets", workerUrl });
      state.workerUrl = workerUrl;
    }

    // ── Step 10: Secrets ──
    if (resumeIdx <= stepIndex("secrets")) {
      printStepHeader(9, total, "\u30b7\u30fc\u30af\u30ec\u30c3\u30c8\u8a2d\u5b9a");

      // Generate keys if not already done
      if (!state.apiKey) {
        state.apiKey = generateApiKey();
      }
      if (!state.encryptionKey) {
        state.encryptionKey = generateEncryptionKey();
      }

      const redirectUri = setSecrets({
        projectName: state.projectName!,
        googleClientId: state.googleClientId!,
        googleClientSecret: state.googleClientSecret!,
        workerUrl: state.workerUrl!,
        apiKey: state.apiKey,
        encryptionKey: state.encryptionKey,
      });

      saveState({
        step: "oauth-redirect",
        apiKey: state.apiKey,
        encryptionKey: state.encryptionKey,
        googleRedirectUri: redirectUri,
      });
      state.googleRedirectUri = redirectUri;
    }

    // ── Step 11: OAuth redirect URI update ──
    if (resumeIdx <= stepIndex("oauth-redirect")) {
      printStepHeader(10, total, "OAuth \u30ea\u30c0\u30a4\u30ec\u30af\u30c8 URI \u66f4\u65b0");
      console.log(`
  \u26a0  Google Cloud Console \u3067 OAuth \u30ea\u30c0\u30a4\u30ec\u30af\u30c8 URI \u3092\u66f4\u65b0\u3057\u3066\u304f\u3060\u3055\u3044\u3002

  \u65b0\u3057\u3044\u30ea\u30c0\u30a4\u30ec\u30af\u30c8 URI:
    ${state.googleRedirectUri}

  \u624b\u9806:
    1. https://console.cloud.google.com/apis/credentials \u3092\u958b\u304f
    2. OAuth 2.0 \u30af\u30e9\u30a4\u30a2\u30f3\u30c8 ID \u3092\u7de8\u96c6
    3. \u300c\u627f\u8a8d\u6e08\u307f\u306e\u30ea\u30c0\u30a4\u30ec\u30af\u30c8 URI\u300d\u306b\u4e0a\u8a18 URL \u3092\u8ffd\u52a0
    4. \u4fdd\u5b58
`);
      await prompt("  \u66f4\u65b0\u5b8c\u4e86\u5f8c\u3001Enter \u3092\u62bc\u3057\u3066\u304f\u3060\u3055\u3044...");
      saveState({ step: "oauth-authorize" });
    }

    // ── Step 12: OAuth authorization ──
    if (resumeIdx <= stepIndex("oauth-authorize")) {
      printStepHeader(11, total, "OAuth \u8a8d\u8a3c");
      const authUrl = `${state.workerUrl}/api/auth/url`;
      console.log(`
  \u30d6\u30e9\u30a6\u30b6\u3067 OAuth \u8a8d\u8a3c\u3092\u5b8c\u4e86\u3057\u3066\u304f\u3060\u3055\u3044\u3002

  \u8a8d\u8a3c URL:
    ${authUrl}

  \u30d6\u30e9\u30a6\u30b6\u3067\u4e0a\u8a18 URL \u3092\u958b\u304d\u3001Google \u30a2\u30ab\u30a6\u30f3\u30c8\u3067\u30ed\u30b0\u30a4\u30f3\u3057\u3066
  YouTube \u30c1\u30e3\u30f3\u30cd\u30eb\u3078\u306e\u30a2\u30af\u30bb\u30b9\u3092\u8a31\u53ef\u3057\u3066\u304f\u3060\u3055\u3044\u3002
`);

      // Try to open browser
      try {
        const { execSync } = await import("node:child_process");
        const platform = process.platform;
        if (platform === "darwin") {
          execSync(`open "${authUrl}"`, { stdio: "ignore" });
          console.log("  \u2714 \u30d6\u30e9\u30a6\u30b6\u3092\u958b\u304d\u307e\u3057\u305f");
        } else if (platform === "linux") {
          execSync(`xdg-open "${authUrl}"`, { stdio: "ignore" });
          console.log("  \u2714 \u30d6\u30e9\u30a6\u30b6\u3092\u958b\u304d\u307e\u3057\u305f");
        }
      } catch {
        console.log("  \u2139  \u30d6\u30e9\u30a6\u30b6\u3092\u624b\u52d5\u3067\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002");
      }

      await prompt("  \u8a8d\u8a3c\u5b8c\u4e86\u5f8c\u3001Enter \u3092\u62bc\u3057\u3066\u304f\u3060\u3055\u3044...");
      saveState({ step: "deploy-admin" });
    }

    // ── Step 13: Deploy admin ──
    if (resumeIdx <= stepIndex("deploy-admin")) {
      printStepHeader(12, total, "Admin UI \u30c7\u30d7\u30ed\u30a4");
      const pagesUrl = deployAdmin(state.projectName!, state.workerUrl!);
      saveState({ step: "mcp-config", pagesUrl });
      state.pagesUrl = pagesUrl;
    }

    // ── Step 14: MCP config ──
    if (resumeIdx <= stepIndex("mcp-config")) {
      printStepHeader(13, total, "MCP \u8a2d\u5b9a");
      writeMcpConfig(state.workerUrl!, state.apiKey!);
      saveState({ step: "complete" });
    }

    // ── Step 15: Complete ──
    printStepHeader(14, total, "\u30bb\u30c3\u30c8\u30a2\u30c3\u30d7\u5b8c\u4e86");
    printComplete(state);
    clearState();
  } finally {
    closePrompt();
  }
}
