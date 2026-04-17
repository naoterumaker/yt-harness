import { promptDefault } from "../lib/prompt.js";

export async function getProjectName(current?: string): Promise<string> {
  if (current) {
    console.log(`  現在のプロジェクト名: ${current}`);
  }
  const name = await promptDefault("  プロジェクト名を入力", current || "yt-harness");
  // sanitize: lowercase, replace spaces/special chars with hyphens
  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (sanitized !== name) {
    console.log(`  -> 正規化: ${sanitized}`);
  }
  return sanitized;
}
