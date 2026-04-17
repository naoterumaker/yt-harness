#!/usr/bin/env node

import { run } from "./cli.js";

run().catch((err) => {
  console.error("\n\u274c 致命的なエラーが発生しました:", err instanceof Error ? err.message : err);
  console.log("\n\u21bb  再実行すると、中断したステップから再開できます。");
  process.exit(1);
});
