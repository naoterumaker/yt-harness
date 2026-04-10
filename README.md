# YouTube Harness

YouTube チャンネル運用自動化プラットフォーム。動画管理・コメントゲート・登録者追跡・Quota管理をCloudflare Workers + D1で実現。

## Architecture

```
yt-harness/
├── apps/
│   ├── web/                    # Next.js 15 Admin UI
│   └── worker/                 # Cloudflare Workers + Hono
├── packages/
│   ├── db/                     # D1 schema + query layer
│   ├── mcp/                    # MCP Server (~33 tools)
│   ├── yt-sdk/                 # YouTube API wrapper (OAuth 2.0)
│   ├── sdk/                    # TypeScript SDK
│   ├── shared/                 # Shared types
│   └── create-yt-harness/      # CLI setup tool
```

## Features

- **動画管理** — メタデータ編集・予約公開・メトリクス追跡
- **コメントゲート** — キーワードトリガーで自動返信・抽選機能付き
- **コメントシーケンス** — 段階的自動返信（ステップメール的）
- **登録者追跡** — 日次スナップショット・タグ管理
- **Quota Guard** — YouTube API 10,000 units/日 の使用量をリアルタイム監視
- **MCP Server** — Claude Desktop / Claude Code から全機能を操作
- **Admin UI** — ダークテーマのダッシュボード（14ページ）

## Quick Start

```bash
# 1. Clone
git clone https://github.com/naoterumaker/yt-harness.git
cd yt-harness

# 2. Install
pnpm install

# 3. Build
pnpm build

# 4. Setup (interactive)
npx create-yt-harness

# 5. Start Worker
cd apps/worker && npx wrangler dev --local

# 6. Start Admin UI
cd apps/web && pnpm dev
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Cloudflare account (Workers + D1)
- Google Cloud Console project with:
  - YouTube Data API v3
  - YouTube Analytics API
  - OAuth 2.0 client credentials

## MCP Integration

`.mcp.json` に追加:

```json
{
  "mcpServers": {
    "yt-harness": {
      "command": "node",
      "args": ["path/to/yt-harness/packages/mcp/dist/index.js"],
      "env": {
        "YT_HARNESS_API_URL": "http://localhost:8787",
        "YT_HARNESS_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Quota Costs (YouTube Data API v3)

| Operation | Cost |
|-----------|------|
| videos.list | 1 unit |
| videos.insert | 1,600 units |
| videos.update | 50 units |
| comments.list | 1 unit |
| comments.insert | 50 units |
| search.list | 100 units (delegated to youtube_boster_pack) |

Daily limit: **10,000 units**

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Backend**: Hono
- **Frontend**: Next.js 15 + Tailwind CSS
- **Auth**: OAuth 2.0 (Google)
- **AI Integration**: MCP (Model Context Protocol)
- **Monorepo**: pnpm workspaces

## License

MIT
