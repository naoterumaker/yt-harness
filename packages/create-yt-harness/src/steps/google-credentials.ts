import { prompt, promptRequired } from "../lib/prompt.js";
import type { SetupState } from "../lib/state.js";

export async function googleCredentials(
  state: Partial<SetupState>,
): Promise<{ clientId: string; clientSecret: string }> {
  if (state.googleClientId && state.googleClientSecret) {
    console.log("  \u2714 Google OAuth 認証情報は設定済みです");
    console.log(`    Client ID: ${state.googleClientId.slice(0, 20)}...`);
    const reuse = await prompt("  既存の認証情報を使用しますか？ (Y/n): ");
    if (reuse.toLowerCase() !== "n") {
      return { clientId: state.googleClientId, clientSecret: state.googleClientSecret };
    }
  }

  console.log(`
  ┌─────────────────────────────────────────────────────────┐
  │  Google Cloud Console でのセットアップが必要です          │
  │                                                         │
  │  1. プロジェクトを作成                                    │
  │     https://console.cloud.google.com                    │
  │                                                         │
  │  2. YouTube Data API v3 を有効化                          │
  │     -> API とサービス > ライブラリ                         │
  │     -> 「YouTube Data API v3」を検索して有効化             │
  │                                                         │
  │  3. YouTube Analytics API を有効化                        │
  │     -> 同様に「YouTube Analytics API」を有効化            │
  │                                                         │
  │  4. OAuth 2.0 クライアント ID を作成                      │
  │     -> API とサービス > 認証情報                           │
  │     -> 認証情報を作成 > OAuth クライアント ID              │
  │     -> アプリケーションの種類: 「ウェブ アプリケーション」  │
  │                                                         │
  │  5. リダイレクト URI を設定                                │
  │     -> http://localhost:8787/api/auth/callback            │
  │     (デプロイ後に正しいURLへ更新します)                    │
  │                                                         │
  └─────────────────────────────────────────────────────────┘
`);

  await prompt("  準備ができたら Enter を押してください...");

  const clientId = await promptRequired(
    "\n  GOOGLE_CLIENT_ID を入力: ",
    "GOOGLE_CLIENT_ID",
  );
  const clientSecret = await promptRequired(
    "  GOOGLE_CLIENT_SECRET を入力: ",
    "GOOGLE_CLIENT_SECRET",
  );

  return { clientId, clientSecret };
}
