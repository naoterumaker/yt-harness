# YouTube Harness — Master Implementation Plan

## Architecture
```
yt-harness/
├── apps/
│   ├── web/          # Next.js 15 Admin UI
│   └── worker/       # Cloudflare Workers + Hono
├── packages/
│   ├── db/           # D1 schema + query layer
│   ├── mcp/          # MCP Server (~30 tools)
│   ├── yt-sdk/       # YouTube API wrapper (OAuth 2.0)
│   ├── sdk/          # TypeScript SDK
│   ├── shared/       # Shared types
│   └── create-yt-harness/  # CLI setup tool
```

## Phases (execute in order)

### Phase 1: DB + Shared Types
**Package:** packages/shared/, packages/db/
**Tasks:**
- Shared types: YtChannel, Video, Comment, CommentGate, CommentGateDelivery, Subscriber, SubscriberSnapshot, CommentSequence, SequenceMessage, SequenceEnrollment, Playlist, QuotaUsage, Tag, SubscriberTag, StaffMember, Setting, Campaign
- DB schema.sql: 15 tables (yt_channels, videos, comments, comment_gates, comment_gate_deliveries, subscribers, subscriber_snapshots, comment_sequences, sequence_messages, sequence_enrollments, playlists, quota_usage, tags, subscriber_tags, staff_members, settings, campaigns) + indexes
- Query layer: channels, videos, comments, comment-gates, subscribers, comment-sequences, playlists, quota-usage, tags, staff, settings, campaigns
- DB index + migrate utility
- Wire to Worker /api/health (DB connection test)

### Phase 2: YouTube SDK
**Package:** packages/yt-sdk/
**Tasks:**
- OAuth 2.0 Manager (getAuthUrl, exchangeCode, refreshToken, ensureFreshToken)
- Scopes constants (youtube.readonly, youtube.upload, youtube.force-ssl, yt-analytics.readonly)
- HTTP Client with auth header + error handling + retry
- Quota Tracker (QUOTA_COSTS map, trackUsage, getRemainingQuota, canAfford, DAILY_LIMIT=10000)
- Videos Resource (list, get, update, delete, rate, getMetrics, setThumbnail)
- Comments Resource (listByVideo, insert, reply, update, delete, setModerationStatus)
- Channels Resource (getMine, getById, listSubscribers)
- Playlists Resource (list, create, update, delete, addVideo, removeVideo)
- Analytics Resource (getChannelAnalytics, getVideoAnalytics)
- YouTubeClient entry point combining all resources

### Phase 3: Worker Backend
**Package:** apps/worker/
**Tasks:**
- Middleware: quota-guard, auth (Bearer token), channel (auto token refresh)
- Routes (16): health, setup, auth, yt-channels, videos, comments, comment-gates, subscribers, comment-sequences, playlists, analytics, usage, tags, staff, campaigns, verify
- Services (8): gate-processor, sequence-processor, scheduler, subscriber-tracker, video-sync, quota-manager, comment-sync, analytics-sync
- Cron handler (5min): gate processing, sequence processing, scheduled publishes, token refresh, daily tasks
- Error classes: QuotaExceededError, AuthError, NotFoundError, ValidationError

### Phase 4: MCP Server
**Package:** packages/mcp/
**Tasks:**
- MCP server entry point (@modelcontextprotocol/sdk)
- YTHarnessClient (HTTP client to Worker API)
- Tools (~30): videos(7), comments(5), channels(3), playlists(5), analytics(1), gates(5), sequences(3), usage(2), staff(2)
- Bilingual descriptions (Japanese/English)
- upload_video with ⚠️ 1,600 quota units warning
- bin entry: yt-harness-mcp

### Phase 5: TypeScript SDK
**Package:** packages/sdk/
**Tasks:**
- HttpClient (get, post, put, delete + HarnessApiError)
- Resource classes: Channels, Videos, Comments, Gates, Subscribers, Sequences, Playlists, Analytics, Quota, Tags, Staff, Campaigns
- YTHarness client entry point
- Dual ESM/CJS build (tsup)

### Phase 6: Admin UI
**Package:** apps/web/
**Tasks:**
- Layout: sidebar nav + header + Quota gauge (green >50%, yellow 20-50%, red <20%)
- Dashboard: quota status, video metrics, subscriber graph, active gates, recent comments
- Video pages: list (filter/sort), detail (edit metadata, metrics, schedule)
- Comment pages: list (cross-video, moderation), detail + reply
- Gate pages: list, create form (trigger/action/template/lottery), detail + deliveries
- Subscriber pages: list (tags, graph), detail (profile, history)
- Sequence pages: list, create (step editor), detail + enrollments
- Playlist pages: list, detail + video management
- Analytics page: period selector, metrics cards, charts, top 10 videos
- Settings page: channel OAuth, API key, quota alerts, staff, webhooks
- Shared: UI components, chart components, API helpers, formatters
- Tailwind + dark mode + responsive

### Phase 7: CLI Setup
**Package:** packages/create-yt-harness/
**Tasks:**
- CLI framework (inquirer + ora + chalk)
- 13-step setup: welcome, project name, Google Cloud Console guide, credentials input, Cloudflare setup, D1 database ID, schema migration, env vars, install, build, OAuth authorization, verification, complete
- Resume support (.yt-harness-setup.json)
- Template files (wrangler.toml, .dev.vars, mcp-config.json)

### Phase 8: Integration Testing
**Tasks:**
- Build verification (pnpm install, pnpm build, tsc --noEmit)
- OAuth 2.0 E2E flow
- Video CRUD, Comment operations
- Comment Gate E2E (create → comment → auto-reply → delivery record)
- Comment Sequence E2E
- Subscriber tracking
- MCP integration (Claude Desktop)
- SDK integration test
- Admin UI integration
- CLI setup E2E
- OSS prep (README, LICENSE, CI, .npmrc)

## Key Design Points

### Quota Guard (critical)
- Check remaining quota before every YouTube API call
- Track in quota_usage table (PT midnight reset)
- Quota gauge in Admin UI header
- Auto-stop at threshold (remaining < 500 units)

### OAuth 2.0 Token Management
- access_token expires in 1 hour → auto-refresh via refresh_token
- Check token_expires_at on every request/cron
- Update DB on refresh

### Comment Gates (YouTube engagement gates)
- Triggers: comment, subscribe, like, comment_keyword
- Actions: reply, pin_comment, verify_only
- Template vars: {username}, {link}
- Lottery: lottery_rate for probability-based delivery
- Polling: hot_window strategy (frequent → decay)

### Video Upload Strategy
- Workers 100MB limit → direct YouTube Resumable Upload from Admin UI
- Worker handles metadata only

## DB Schema Reference
See packages/db/src/schema.sql (to be created in Phase 1)

## Quota Cost Reference
- videos.list: 1, videos.insert: 1600, videos.update: 50, videos.delete: 50
- comments.list: 1, comments.insert: 50, comments.update: 50, comments.delete: 50
- channels.list: 1, playlists.list: 1, playlists.insert: 50
- subscriptions.list: 1, search.list: 100 (not used — delegated to youtube_boster_pack)
