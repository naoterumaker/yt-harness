import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline";

export function generateKey(): string {
  return randomBytes(32).toString("hex");
}

export function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export function printBanner(): void {
  console.log(`
╔══════════════════════════════════════════╗
║                                          ║
║       🎬  YouTube Harness Setup  🎬      ║
║                                          ║
║   Automated YouTube channel management   ║
║   powered by Cloudflare Workers + D1     ║
║                                          ║
╚══════════════════════════════════════════╝
`);
}

export function printStep(n: number, title: string): void {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`  Step ${n}: ${title}`);
  console.log(`${"=".repeat(50)}\n`);
}
