import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { exec, execLive } from "../lib/exec.js";
import { getRepoDir } from "./clone-repo.js";

export function createDatabase(
  projectName: string,
  existingDbId?: string,
): { databaseId: string; databaseName: string } {
  const dbName = `${projectName}-db`;

  if (existingDbId) {
    console.log(`  \u2714 既存のデータベースを使用: ${dbName} (${existingDbId})`);
    return { databaseId: existingDbId, databaseName: dbName };
  }

  console.log(`\n  D1 データベースを作成中: ${dbName}`);
  const result = exec(`npx wrangler d1 create ${dbName}`, { silent: true });

  if (!result.success) {
    if (result.stderr.includes("already exists")) {
      console.log(`  \u26a0  データベース "${dbName}" は既に存在します。`);
      // Try to get the ID from list
      const listResult = exec("npx wrangler d1 list --json", { silent: true });
      if (listResult.success) {
        try {
          const databases = JSON.parse(listResult.stdout);
          const db = databases.find((d: { name: string }) => d.name === dbName);
          if (db) {
            console.log(`  \u2714 既存のデータベース ID: ${db.uuid}`);
            return { databaseId: db.uuid, databaseName: dbName };
          }
        } catch {
          // ignore parse error
        }
      }
      console.error("  \u274c データベース ID を取得できませんでした。");
      console.error(`  手動で確認: npx wrangler d1 list`);
      process.exit(1);
    }
    console.error(`  \u274c D1 データベースの作成に失敗しました: ${result.stderr}`);
    process.exit(1);
  }

  // Parse database_id from output
  const idMatch = result.stdout.match(/database_id\s*=\s*"([^"]+)"/);
  if (!idMatch) {
    console.error("  \u274c database_id の解析に失敗しました。出力:");
    console.error(result.stdout);
    process.exit(1);
  }

  const databaseId = idMatch[1];
  console.log(`  \u2714 データベース作成完了: ${databaseId}`);
  return { databaseId, databaseName: dbName };
}

export function migrateSchema(databaseName: string): void {
  const repoDir = getRepoDir();
  const schemaPath = resolve(repoDir, "packages/db/src/schema.sql");

  if (!existsSync(schemaPath)) {
    console.error(`  \u274c スキーマファイルが見つかりません: ${schemaPath}`);
    process.exit(1);
  }

  console.log(`\n  スキーマを適用中: ${databaseName}`);
  const ok = execLive(
    `npx wrangler d1 execute ${databaseName} --remote --file="${schemaPath}"`,
    { cwd: repoDir },
  );

  if (!ok) {
    console.error("  \u274c スキーマの適用に失敗しました。");
    console.error("  手動で実行してください:");
    console.error(`    npx wrangler d1 execute ${databaseName} --remote --file="${schemaPath}"`);
    process.exit(1);
  }
  console.log("  \u2714 スキーマ適用完了");
}
