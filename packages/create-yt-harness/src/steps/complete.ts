import type { SetupState } from "../lib/state.js";

export function printComplete(state: Partial<SetupState>): void {
  const divider = "=".repeat(56);

  console.log(`
${divider}

  \u2714  YT Harness セットアップ完了！

${divider}

  Worker URL:     ${state.workerUrl || "(未設定)"}
  Admin UI URL:   ${state.pagesUrl || "(未デプロイ)"}
  API Key:        ${state.apiKey ? state.apiKey.slice(0, 12) + "..." : "(未設定)"}
  データベース:   ${state.databaseName || "(未作成)"}

${divider}

  \u25b6 次のステップ:

  1. Google Cloud Console で OAuth リダイレクト URI を更新:
     ${state.googleRedirectUri || `${state.workerUrl}/api/auth/callback`}

  2. ブラウザで OAuth 認証を完了:
     ${state.workerUrl}/api/auth/url

  3. MCP サーバーとして使用:
     Claude Code, Claude Desktop 等で .mcp.json が自動設定済み

  4. 動作確認:
     curl -H "x-api-key: ${state.apiKey || "<YOUR_API_KEY>"}" ${state.workerUrl}/api/quota

${divider}

  \u2139  設定状態は ~/.yt-harness-setup.json に保存されています。
  \u2139  再実行すると中断したステップから再開できます。

  Happy Harnessing!
`);
}
