import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { generateKey, prompt, printBanner, printStep } from "./utils.js";

export async function run(): Promise<void> {
  printBanner();

  // ── Step 1: Welcome ──
  printStep(1, "Welcome");
  console.log("This tool will guide you through setting up YouTube Harness.");
  console.log("You will need:");
  console.log("  - A Google Cloud project with YouTube APIs enabled");
  console.log("  - A Cloudflare account with Wrangler installed");
  console.log("");

  // ── Step 2: Google Cloud Console Guide ──
  printStep(2, "Google Cloud Console Setup");
  console.log("Please complete the following in Google Cloud Console:");
  console.log("");
  console.log("  1. Create a project at https://console.cloud.google.com");
  console.log("  2. Enable YouTube Data API v3");
  console.log("     -> APIs & Services > Library > YouTube Data API v3");
  console.log("  3. Enable YouTube Analytics API");
  console.log("     -> APIs & Services > Library > YouTube Analytics API");
  console.log("  4. Create OAuth 2.0 client ID (Web application)");
  console.log("     -> APIs & Services > Credentials > Create Credentials > OAuth client ID");
  console.log("  5. Set the redirect URI to:");
  console.log("     http://localhost:8787/api/auth/callback");
  console.log("");
  await prompt("Press Enter when ready...");

  // ── Step 3: Credentials Input ──
  printStep(3, "Google OAuth Credentials");
  const clientId = await prompt("Enter your GOOGLE_CLIENT_ID: ");
  if (!clientId) {
    console.error("Error: GOOGLE_CLIENT_ID is required.");
    process.exit(1);
  }

  const clientSecret = await prompt("Enter your GOOGLE_CLIENT_SECRET: ");
  if (!clientSecret) {
    console.error("Error: GOOGLE_CLIENT_SECRET is required.");
    process.exit(1);
  }

  // ── Step 4: Cloudflare Setup Guide ──
  printStep(4, "Cloudflare Setup");
  console.log("Please complete the following Cloudflare setup:");
  console.log("");
  console.log("  1. Log in to Wrangler (if not already):");
  console.log("     $ npx wrangler login");
  console.log("");
  console.log("  2. Create the D1 database:");
  console.log("     $ npx wrangler d1 create yt-harness-db");
  console.log("");
  console.log("  Copy the database_id from the output.");
  console.log("");
  await prompt("Press Enter when ready...");

  // ── Step 5: D1 Database ID ──
  printStep(5, "D1 Database ID");
  const databaseId = await prompt("Enter the D1 database_id: ");
  if (!databaseId) {
    console.error("Error: D1 database_id is required.");
    process.exit(1);
  }

  // ── Step 6: Generate Config ──
  printStep(6, "Generate Configuration");

  const encryptionKey = generateKey();
  const apiKey = generateKey();

  const devVars = [
    `GOOGLE_CLIENT_ID=${clientId}`,
    `GOOGLE_CLIENT_SECRET=${clientSecret}`,
    `ENCRYPTION_KEY=${encryptionKey}`,
    `API_KEY=${apiKey}`,
  ].join("\n");

  const appDir = resolve(process.cwd(), "apps/workers");
  const devVarsPath = resolve(appDir, ".dev.vars");

  writeFileSync(devVarsPath, devVars + "\n", "utf-8");
  console.log(`Created ${devVarsPath}`);
  console.log("");
  console.log("Generated secrets:");
  console.log(`  ENCRYPTION_KEY = ${encryptionKey.slice(0, 8)}...`);
  console.log(`  API_KEY         = ${apiKey.slice(0, 8)}...`);

  // ── Step 7: Update wrangler.toml ──
  printStep(7, "Update wrangler.toml");

  const wranglerPath = resolve(appDir, "wrangler.toml");
  if (existsSync(wranglerPath)) {
    let wranglerContent = readFileSync(wranglerPath, "utf-8");
    wranglerContent = wranglerContent.replace(
      /database_id\s*=\s*"[^"]*"/,
      `database_id = "${databaseId}"`,
    );
    writeFileSync(wranglerPath, wranglerContent, "utf-8");
    console.log(`Updated ${wranglerPath} with database_id.`);
  } else {
    console.log(`Warning: ${wranglerPath} not found. Please update manually.`);
  }

  // ── Step 8: Next Steps ──
  printStep(8, "Next Steps");
  console.log("Setup complete! Run the following commands to get started:");
  console.log("");
  console.log("  pnpm install");
  console.log("  pnpm build");
  console.log("  pnpm dev");
  console.log("");
  console.log("Happy harnessing!");
}
