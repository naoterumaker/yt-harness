# YouTube Harness — Analytics 機能 設計書

> **用途:** Maestro プレイブック。Phase A〜D を順に実装する。
> **作成日:** 2026-04-19
> **前提:** MASTER_PLAN.md の Phase 1〜8 が完了していること（DB / Worker / MCP / Admin UI の骨格が存在する）

---

## 1. アーキテクチャ概要

### 1.1 既存スタックへの統合方針

```
YouTube Data API v3          YouTube Analytics API       YouTube Reporting API
  (動画メタデータ)               (インプレ・CTR・AVD)          (日次バルクCSV)
       │                              │                           │
       └──────────────────────────────┴───────────────────────────┘
                                      │
                              packages/yt-sdk/
                          (既存 YouTubeClient に追加)
                                      │
                              apps/worker/
                          (新規ルート + サービス追加)
                                      │
                         ┌────────────┴────────────┐
                    packages/db/               Cloudflare Cron
                (新規5テーブル追加)          (日次同期ジョブ追加)
                         │
                   apps/web/
               (Admin UI 分析ページ再設計)
                         │
                   packages/mcp/
               (Analytics MCPツール追加)
```

### 1.2 API 使い分け方針

| API | 用途 | Quota | 取得タイミング |
|-----|------|-------|----------------|
| **YouTube Data API v3** | 動画メタデータ（再生回数・いいね・コメント数） | 10,000 units/日（共有） `videos.list` = 50本で1 unit | 日次 Cron（毎朝 2:00 JST） |
| **YouTube Analytics API** | インプレッション・CTR・AVD・視聴時間・登録者増減・トラフィックソース・視聴者属性 | 別枠（制限緩い） | 日次 Cron（毎朝 2:30 JST）。昨日分を取得 |
| **YouTube Reporting API** | 大量データの過去遡及取得・Reach reports（2026-01-15〜） | 別枠 | 初回セットアップ時 + 月次バッチ |

### 1.3 データフロー

```
[Cron: 毎日 2:00 JST]
  1. YouTube Data API → videos.list (50本/1 unit) → video_metrics_snapshots に INSERT
  2. YouTube Analytics API → getChannelAnalytics → analytics_daily に INSERT
  3. Analytics API → traffic_sources + viewer_demographics に INSERT

[Worker API (リクエスト駆動)]
  POST /api/channels/:id/analytics/sync  → 手動同期トリガー
  GET  /api/channels/:id/analytics/*     → D1 から集計して返す
  POST /api/channels/:id/changelog       → change_log に INSERT
  GET  /api/videos/:id/snapshots         → video_metrics_snapshots から返す
```

---

## 2. 新規 DB テーブル設計

> 追加先: `packages/db/src/schema.sql`

### 2.1 `video_metrics_snapshots` — 動画メトリクス日次スナップショット

> **修正済み:** FK を `videos(video_id)` に変更。日付は PT 基準に統一。`updated_at` 追加。

```sql
CREATE TABLE IF NOT EXISTS video_metrics_snapshots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id      TEXT    NOT NULL,
  channel_id    TEXT    NOT NULL,
  snapshot_date TEXT    NOT NULL, -- YYYY-MM-DD (PT基準)
  view_count    INTEGER NOT NULL DEFAULT 0,
  like_count    INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (video_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_vms_channel_date ON video_metrics_snapshots(channel_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_vms_video_date   ON video_metrics_snapshots(video_id, snapshot_date);
```

**用途:** 再生回数・いいね数の時系列変化を追う。YouTube Studio の「動画別アナリティクス」グラフ相当。

### 2.2 `analytics_daily` — Analytics API 日次データ

> **修正済み:** メトリクス名を API 準拠に変更。NULL+UNIQUE 問題を番兵値 `__CHANNEL__` で解決。`updated_at` 追加。日付は PT 基準。lookback 3-7日で再取得+upsert 前提。

```sql
CREATE TABLE IF NOT EXISTS analytics_daily (
  id                                  INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id                          TEXT    NOT NULL,
  video_id                            TEXT    NOT NULL DEFAULT '__CHANNEL__', -- '__CHANNEL__' = チャンネル全体集計
  analytics_date                      TEXT    NOT NULL, -- YYYY-MM-DD (PT基準)
  video_thumbnail_impressions         INTEGER, -- API: videoThumbnailImpressions
  video_thumbnail_impressions_ctr     REAL,    -- API: videoThumbnailImpressionsClickRate (0.0〜1.0)
  views                               INTEGER,
  estimated_minutes_watched           INTEGER,
  average_view_duration               REAL,    -- 秒
  average_view_percentage             REAL,    -- 0.0〜100.0
  subscribers_gained                  INTEGER,
  subscribers_lost                    INTEGER,
  likes                               INTEGER,
  comments                            INTEGER,
  shares                              INTEGER,
  engaged_views                       INTEGER, -- Shorts 用（2025/3/31〜）
  created_at                          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at                          TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (channel_id, video_id, analytics_date)
);
CREATE INDEX IF NOT EXISTS idx_ad_channel_date ON analytics_daily(channel_id, analytics_date);
CREATE INDEX IF NOT EXISTS idx_ad_video_date   ON analytics_daily(video_id, analytics_date);
```

**用途:** CTR・AVD・インプレッション・視聴時間の日次推移グラフに使用。`video_id IS NULL` がチャンネル全体、`video_id IS NOT NULL` が動画別。

### 2.3 `traffic_sources` — トラフィックソース内訳

> **修正済み:** video_id に番兵値。traffic_type は API 生値で保存（UIでラベル変換）。

```sql
CREATE TABLE IF NOT EXISTS traffic_sources (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id      TEXT    NOT NULL,
  video_id        TEXT    NOT NULL DEFAULT '__CHANNEL__',
  analytics_date  TEXT    NOT NULL, -- YYYY-MM-DD (PT基準)
  traffic_type    TEXT    NOT NULL, -- API生値: EXT_URL, RELATED_VIDEO, SUBSCRIBER, NO_LINK_OTHER, YT_SEARCH, SHORTS 等
  views           INTEGER DEFAULT 0,
  estimated_minutes_watched INTEGER DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (channel_id, video_id, analytics_date, traffic_type)
);
CREATE INDEX IF NOT EXISTS idx_ts_channel_date ON traffic_sources(channel_id, analytics_date);
```

**用途:** 視聴者がどこから来ているかの内訳。traffic_type は API 生値で保存し、UI 側で日本語ラベルに変換。

### 2.4 `viewer_demographics_pct` — 視聴者属性（年齢・性別 — viewerPercentage）

> **修正済み:** 年齢/性別（%ベース）と国/デバイス（件数ベース）を分離。NULLは欠損/閾値未達を意味する（0とは区別）。

```sql
CREATE TABLE IF NOT EXISTS viewer_demographics_pct (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id       TEXT    NOT NULL,
  video_id         TEXT    NOT NULL DEFAULT '__CHANNEL__',
  analytics_date   TEXT    NOT NULL, -- YYYY-MM-DD (PT基準)
  dimension_type   TEXT    NOT NULL, -- 'ageGroup', 'gender'
  dimension_value  TEXT    NOT NULL, -- 'age13-17', 'age18-24', 'MALE', 'FEMALE' 等
  viewer_percentage REAL,            -- 0.0〜100.0 (NULL = 閾値未達で非開示)
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (channel_id, video_id, analytics_date, dimension_type, dimension_value)
);
CREATE INDEX IF NOT EXISTS idx_vdp_channel_date ON viewer_demographics_pct(channel_id, analytics_date);
```

### 2.5 `viewer_demographics_counts` — 視聴者属性（国・デバイス — 件数ベース）

```sql
CREATE TABLE IF NOT EXISTS viewer_demographics_counts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id       TEXT    NOT NULL,
  video_id         TEXT    NOT NULL DEFAULT '__CHANNEL__',
  analytics_date   TEXT    NOT NULL, -- YYYY-MM-DD (PT基準)
  dimension_type   TEXT    NOT NULL, -- 'country', 'deviceType', 'operatingSystem'
  dimension_value  TEXT    NOT NULL, -- 'JP', 'US', 'MOBILE', 'DESKTOP' 等
  views            INTEGER,
  estimated_minutes_watched INTEGER,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (channel_id, video_id, analytics_date, dimension_type, dimension_value)
);
CREATE INDEX IF NOT EXISTS idx_vdc_channel_date ON viewer_demographics_counts(channel_id, analytics_date);
```

**用途:** 年齢・性別は `viewerPercentage`（%）、国・デバイスは `views`/`estimatedMinutesWatched`（件数）。合計が100%にならない場合がある（API仕様）。

### 2.6 `change_log` — 施策ログ

> **修正済み:** video_id に番兵値。PT日付列追加。impact_score は Phase C-2 で後から算出（初期はNULL）。

```sql
CREATE TABLE IF NOT EXISTS change_log (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id               TEXT    NOT NULL,
  video_id                 TEXT    NOT NULL DEFAULT '__CHANNEL__',
  change_type              TEXT    NOT NULL, -- 'thumbnail', 'title', 'description', 'tags', 'end_screen', 'card', 'chapter', 'pinned_comment', 'other'
  changed_at               TEXT    NOT NULL, -- 施策実施日時（ISO 8601, timezone付き）
  effective_analytics_date  TEXT,            -- PT基準の日付（YYYY-MM-DD）。グラフマーカー用
  note                     TEXT,            -- 施策メモ
  before_value             TEXT,            -- 変更前の値
  after_value              TEXT,            -- 変更後の値
  impact_score             REAL,            -- 施策効果スコア（後から算出、初期NULL）
  created_by               TEXT    NOT NULL DEFAULT 'mcp',
  created_at               TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cl_channel     ON change_log(channel_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_cl_video       ON change_log(video_id, changed_at);
CREATE INDEX IF NOT EXISTS idx_cl_type        ON change_log(change_type);
CREATE INDEX IF NOT EXISTS idx_cl_analytics   ON change_log(effective_analytics_date);
```

**用途:** 施策（サムネ変更・タイトル変更）と数値変化を時系列で突き合わせ、因果を追う。`effective_analytics_date` をキーにグラフ上に変更マーカー（▲）をオーバーレイ表示する。

---

## 3. Worker 新規エンドポイント

> 追加先: `apps/worker/src/routes/analytics.ts`（新規ファイル）

### 3.1 エンドポイント一覧

| メソッド | パス | 説明 | Quota消費 |
|---------|------|------|-----------|
| `POST` | `/api/channels/:id/analytics/sync` | Analytics API から手動同期 | Analytics API（別枠） |
| `GET` | `/api/channels/:id/analytics/impressions` | インプレッション推移 | D1のみ（0） |
| `GET` | `/api/channels/:id/analytics/ctr` | CTR推移 | D1のみ（0） |
| `GET` | `/api/channels/:id/analytics/avd` | 平均視聴時間推移 | D1のみ（0） |
| `GET` | `/api/channels/:id/analytics/traffic` | トラフィックソース内訳 | D1のみ（0） |
| `GET` | `/api/channels/:id/analytics/demographics` | 視聴者属性 | D1のみ（0） |
| `POST` | `/api/channels/:id/changelog` | 施策ログ記録 | 0 |
| `GET` | `/api/channels/:id/changelog` | 施策ログ一覧 | 0 |
| `GET` | `/api/videos/:id/snapshots` | 動画メトリクス推移 | D1のみ（0） |

### 3.2 クエリパラメータ共通仕様

```
?start_date=2026-01-01   # YYYY-MM-DD（省略時: 30日前）
?end_date=2026-04-19     # YYYY-MM-DD（省略時: 昨日）
?video_id=xxx            # 動画絞り込み（省略時: チャンネル全体）
?granularity=day|week    # 集計単位（省略時: day）
```

### 3.3 レスポンス例（CTR推移）

```json
{
  "channel_id": "UCxxxxx",
  "metric": "ctr",
  "start_date": "2026-03-20",
  "end_date": "2026-04-19",
  "data": [
    { "date": "2026-03-20", "value": 0.048, "impressions": 12400 },
    { "date": "2026-03-21", "value": 0.051, "impressions": 14200 }
  ],
  "change_log_events": [
    { "date": "2026-03-25", "change_type": "thumbnail", "note": "サムネ差し替え" }
  ]
}
```

> `change_log_events` を含めることで、グラフ上の変化点に施策マーカーを表示できる。

### 3.4 新規サービス

| ファイル | 役割 |
|---------|------|
| `apps/worker/src/services/analytics-sync.ts` | Analytics API 同期ロジック（日次バッチ・手動トリガー共用） |
| `apps/worker/src/services/metrics-snapshot.ts` | Data API v3 による動画メトリクス日次取得 |

---

## 4. Admin UI 分析ページ再設計

> 追加先: `apps/web/src/app/channels/[id]/analytics/`

### 4.1 ダッシュボードに追加するカード（既存ダッシュボードに差し込み）

| カード | 表示内容 | データソース |
|--------|---------|-------------|
| **CTR カード** | 直近7日の平均CTR + 前週比 | `analytics_daily` |
| **AVD カード** | 直近7日の平均視聴時間 + 前週比 | `analytics_daily` |
| **インプレッション カード** | 直近7日のインプレッション合計 + 前週比 | `analytics_daily` |
| **VPH ランキング** | 直近48h の動画別 VPH トップ5 | `video_metrics_snapshots` + `analytics_daily` |

### 4.2 分析ページのセクション構成

```
/channels/:id/analytics

┌─────────────────────────────────────────────────────────┐
│ 期間セレクター: [7日] [28日] [90日] [カスタム]             │
├──────────────┬──────────────┬──────────────┬────────────┤
│ インプレッション │     CTR      │     AVD      │  視聴時間   │
│   (数値+推移) │  (数値+推移) │  (数値+推移) │ (数値+推移) │
├──────────────┴──────────────┴──────────────┴────────────┤
│ § インプレッション × CTR 折れ線グラフ（2軸）                 │
│   ↑施策マーカー（▲）をオーバーレイ表示                       │
├─────────────────────────────────────────────────────────┤
│ § AVD × 視聴時間 折れ線グラフ                              │
├──────────────────────────┬──────────────────────────────┤
│ § トラフィックソース       │ § 視聴者属性                   │
│   （積み上げ棒グラフ）     │   （年齢: 棒グラフ）            │
│                          │   （性別: 円グラフ）            │
│                          │   （国: 棒グラフ top10）        │
├──────────────────────────┴──────────────────────────────┤
│ § 動画別パフォーマンス一覧（テーブル）                       │
│   [動画] [インプレ] [CTR] [AVD] [再生数] [登録者転換率]      │
│   ▼ 各行クリックで動画別詳細アナリティクスへ遷移              │
├─────────────────────────────────────────────────────────┤
│ § 施策ログタイムライン                                     │
│   [日時] [種別バッジ] [対象動画] [変更内容] [効果スコア]      │
│   ＋ 施策を追加ボタン                                      │
└─────────────────────────────────────────────────────────┘
```

### 4.3 グラフ種別まとめ

| セクション | グラフ種別 | ライブラリ |
|-----------|-----------|-----------|
| インプレッション × CTR | 折れ線（2軸）+ 施策マーカー | Recharts |
| AVD × 視聴時間 | 折れ線（2軸） | Recharts |
| トラフィックソース推移 | 積み上げ棒グラフ | Recharts |
| 視聴者年齢 | 横棒グラフ | Recharts |
| 視聴者性別 | 円グラフ（ドーナツ） | Recharts |
| 視聴者国別 | 棒グラフ top 10 | Recharts |
| 動画別パフォーマンス | テーブル（ソート付き） | 既存 Table コンポーネント |

---

## 5. Cron ジョブ設計

> 追加先: `apps/worker/src/cron/analytics.ts`（新規）
> 既存: `apps/worker/src/cron/index.ts` に登録

### 5.1 ジョブスケジュール

```
毎日 02:00 JST  → metrics-snapshot-job   : Data API v3 で動画メトリクス取得
毎日 02:30 JST  → analytics-sync-job     : Analytics API で昨日分を取得
毎日 03:00 JST  → impact-score-job       : 施策ログの impact_score を自動計算（施策前後3日の CTR/AVD 比較）
```

### 5.2 Quota 消費見積もり（1日あたり）

| ジョブ | API | 計算式 | 消費 units |
|-------|-----|--------|-----------|
| metrics-snapshot-job | Data API v3 | 動画100本 ÷ 50本/unit = 2 units | **2 units** |
| analytics-sync-job | Analytics API | Analytics API は別 Quota 枠 | **0 units (Data API枠外)** |
| 既存 video-sync | Data API v3 | 動画100本 × videos.list(1u/50本) | 2 units |
| その他既存ジョブ | Data API v3 | 推定 | 〜50 units |
| **合計** | | | **〜54 units / 日** (10,000枠に対し余裕あり) |

> Analytics API は Data API とは別の Quota 枠のため、Analytics 機能追加で Data API の消費は実質 **+2 units/日** のみ。

### 5.3 impact_score 算出ロジック

```
施策前3日の平均CTR = pre_ctr
施策後3日の平均CTR = post_ctr
impact_score = (post_ctr - pre_ctr) / pre_ctr × 100  (%)

同様に AVD でも計算し、CTR変化率 × 0.6 + AVD変化率 × 0.4 で合算スコアを算出
```

---

## 6. MCP ツール追加

> 追加先: `packages/mcp/src/tools/analytics.ts`（新規）
> 既存: `packages/mcp/src/index.ts` に登録

### 6.1 新規ツール一覧

| ツール名 | 説明（日/英） | 主なパラメータ |
|---------|-------------|--------------|
| `get_channel_analytics` | チャンネルの日次アナリティクス取得（インプレ・CTR・AVD） / Get daily analytics for a channel | `channel_id`, `start_date`, `end_date`, `metrics[]` |
| `get_video_analytics` | 特定動画のアナリティクス取得 / Get analytics for a specific video | `video_id`, `start_date`, `end_date` |
| `get_traffic_sources` | トラフィックソース内訳取得 / Get traffic source breakdown | `channel_id`, `start_date`, `end_date`, `video_id?` |
| `get_viewer_demographics` | 視聴者属性取得（年齢・性別・国） / Get viewer demographics | `channel_id`, `dimension`, `start_date`, `end_date` |
| `sync_analytics` | Analytics API から手動同期トリガー / Trigger manual analytics sync | `channel_id`, `date?` |
| `add_change_log` | 施策ログを記録（サムネ変更・タイトル変更等） / Log a channel/video change for impact tracking | `channel_id`, `video_id?`, `change_type`, `changed_at`, `note`, `before_value?`, `after_value?` |
| `get_change_log` | 施策ログ一覧取得 / Get change log entries | `channel_id`, `video_id?`, `start_date`, `end_date` |
| `get_video_metrics_history` | 動画メトリクスの時系列推移取得 / Get historical metrics snapshots for a video | `video_id`, `start_date`, `end_date` |

### 6.2 ユースケース例（Claude Desktop から）

```
「先月サムネを変えた動画のCTR変化を教えて」
→ get_change_log で thumbnail 変更を検索
→ get_video_analytics で変更前後を比較
→ 結果をマークダウン表で返す

「チャンネル全体の視聴者属性を教えて」
→ get_viewer_demographics を dimension=age, gender, country で3回呼ぶ
→ 円グラフ用テキスト表で返す
```

---

## 7. 実装フェーズ（Maestro チェックリスト）

### Phase A: 動画メトリクス日次スナップショット（最も簡単・早期価値）

**目標:** 再生回数・いいね数の推移グラフを表示する

- [ ] `packages/db/src/schema.sql` に `video_metrics_snapshots` テーブルを追加
- [ ] `packages/db/src/queries/metrics-snapshots.ts` を新規作成（insert, getByVideoId, getByChannelId クエリ）
- [ ] `packages/shared/src/types.ts` に `VideoMetricsSnapshot` 型を追加
- [ ] `apps/worker/src/services/metrics-snapshot.ts` を新規作成（YouTube Data API v3 `videos.list` で統計取得）
- [ ] `apps/worker/src/cron/index.ts` に `metrics-snapshot-job`（毎日 02:00 JST）を追加
- [ ] `apps/worker/src/routes/analytics.ts` に `GET /api/videos/:id/snapshots` を実装
- [ ] `apps/web/src/app/videos/[id]/page.tsx` の動画詳細ページに再生数推移グラフを追加
- [ ] `pnpm build` でビルド確認
- [ ] Cron を手動トリガーして D1 にデータが入ることを確認

### Phase B: Analytics API 統合（インプレ・CTR・AVD）

**目標:** インプレッション・CTR・AVD の日次推移を可視化する

- [ ] `packages/yt-sdk/src/resources/analytics.ts` に Analytics API クライアントを拡張（`getChannelAnalyticsDetailed` — impressions, CTR, AVD, 視聴時間を取得）
- [ ] `packages/db/src/schema.sql` に `analytics_daily` テーブルを追加
- [ ] `packages/db/src/queries/analytics-daily.ts` を新規作成（upsert, getByChannelId, getByVideoId クエリ）
- [ ] `packages/shared/src/types.ts` に `AnalyticsDaily` 型を追加
- [ ] `apps/worker/src/services/analytics-sync.ts` を新規作成（Analytics API 呼び出し → D1 upsert）
- [ ] `apps/worker/src/cron/index.ts` に `analytics-sync-job`（毎日 02:30 JST）を追加
- [ ] `apps/worker/src/routes/analytics.ts` に以下を実装:
  - `POST /api/channels/:id/analytics/sync`
  - `GET /api/channels/:id/analytics/impressions`
  - `GET /api/channels/:id/analytics/ctr`
  - `GET /api/channels/:id/analytics/avd`
- [ ] `apps/web/src/app/channels/[id]/analytics/page.tsx` を新規作成（インプレ・CTR・AVD 折れ線グラフ）
- [ ] サイドバーナビゲーションに「アナリティクス」メニューを追加
- [ ] ダッシュボードに CTR カード・AVD カード・インプレッションカードを追加
- [ ] `pnpm build` でビルド確認

### Phase C: 施策ログ + 因果追跡

**目標:** サムネ変更・タイトル変更の記録と数値変化の突き合わせ

- [ ] `packages/db/src/schema.sql` に `change_log` テーブルを追加
- [ ] `packages/db/src/queries/change-log.ts` を新規作成（insert, getByChannelId, getByVideoId クエリ）
- [ ] `packages/shared/src/types.ts` に `ChangeLog` 型・`ChangeType` 列挙型を追加
- [ ] `apps/worker/src/routes/analytics.ts` に以下を追加:
  - `POST /api/channels/:id/changelog`
  - `GET /api/channels/:id/changelog`
- [ ] `apps/worker/src/cron/index.ts` に `impact-score-job`（毎日 03:00 JST）を追加
- [ ] `apps/worker/src/services/analytics-sync.ts` に `calculateImpactScore` 関数を実装
- [ ] Analytics API レスポンスに `change_log_events` を含める（グラフマーカー用）
- [ ] `apps/web/src/app/channels/[id]/analytics/page.tsx` にグラフ上の施策マーカー（▲）を追加
- [ ] `apps/web/src/app/channels/[id]/analytics/page.tsx` に施策ログタイムラインセクションを追加
- [ ] 「施策を追加」モーダルフォームを実装（change_type・動画選択・メモ入力）
- [ ] `packages/mcp/src/tools/analytics.ts` に `add_change_log` / `get_change_log` ツールを追加
- [ ] `pnpm build` でビルド確認

### Phase D: トラフィックソース + 視聴者属性

**目標:** どこから来ているか・誰が見ているかを可視化する

- [ ] `packages/yt-sdk/src/resources/analytics.ts` に以下を追加:
  - `getTrafficSources` — `insightTrafficSourceType` dimension で取得
  - `getViewerDemographics` — `ageGroup`, `gender`, `country` dimension で取得
- [ ] `packages/db/src/schema.sql` に `traffic_sources` + `viewer_demographics` テーブルを追加
- [ ] `packages/db/src/queries/traffic-sources.ts` を新規作成
- [ ] `packages/db/src/queries/viewer-demographics.ts` を新規作成
- [ ] `packages/shared/src/types.ts` に `TrafficSource` / `ViewerDemographics` 型を追加
- [ ] `apps/worker/src/services/analytics-sync.ts` にトラフィック・属性の同期処理を追加
- [ ] `apps/worker/src/routes/analytics.ts` に以下を追加:
  - `GET /api/channels/:id/analytics/traffic`
  - `GET /api/channels/:id/analytics/demographics`
- [ ] `apps/web/src/app/channels/[id]/analytics/page.tsx` に以下を追加:
  - トラフィックソース積み上げ棒グラフ
  - 視聴者年齢横棒グラフ
  - 視聴者性別ドーナツ円グラフ
  - 視聴者国別棒グラフ（top 10）
- [ ] `packages/mcp/src/tools/analytics.ts` に残りツール（`get_traffic_sources`, `get_viewer_demographics`）を追加
- [ ] `pnpm build` でビルド確認
- [ ] Analytics API 全メトリクスを手動 sync して D1 に格納されることを E2E 確認

---

## 8. 主要な設計判断と根拠

### なぜ「施策ログ」が必要か

ダッシュボードだけ作っても「見るだけツール」になる。CTR が上がった / 下がった理由を追えなければ次の改善に活かせない。`change_log` テーブルで施策と数値変化を紐付け、`impact_score` を自動算出することで「何をしたら数字が変わったか」を学習できる仕組みにする。

### YouTube Analytics API vs YouTube Reporting API の使い分け

- **Analytics API**: 期間指定でリアルタイムに近い集計値を取得できる。少量〜中量のチャンネルに最適。Quota 別枠なので Data API を圧迫しない。
- **Reporting API**: 数万本規模の大量データや、Reach reports（2026-01-15〜）など Analytics API にないメトリクスが必要な場合に使う。ジョブを設定して CSVをポーリングする手間があるため、Phase A〜D では Analytics API のみ使用し、必要になったタイミングで追加する。

### VPH（Views Per Hour）の算出方法

VPH は YouTube Analytics API で直接取れないため、`video_metrics_snapshots` の差分から近似する：

```
VPH = (views_today - views_yesterday) / 24
```

公開直後 48h は `analytics_daily` の views を使って 1h 単位で計算する。

### APIで取れないもの（諦め項目）

- リアルタイム視聴者数 → YouTube Studio のみ。Worker からは取得不可
- サムネ A/B テスト結果 → YouTube Studio のみ。`change_log` で手動記録 + 自前比較で代替
- 収益詳細 → Reporting API の revenue 系は AdSense 連携が必要。スコープ外

---

## 9. ファイル変更サマリー

| ファイル | 種別 | フェーズ |
|---------|------|---------|
| `packages/db/src/schema.sql` | 変更 | A〜D |
| `packages/db/src/queries/metrics-snapshots.ts` | 新規 | A |
| `packages/db/src/queries/analytics-daily.ts` | 新規 | B |
| `packages/db/src/queries/change-log.ts` | 新規 | C |
| `packages/db/src/queries/traffic-sources.ts` | 新規 | D |
| `packages/db/src/queries/viewer-demographics.ts` | 新規 | D |
| `packages/shared/src/types.ts` | 変更 | A〜D |
| `packages/yt-sdk/src/resources/analytics.ts` | 変更 | B, D |
| `apps/worker/src/services/metrics-snapshot.ts` | 新規 | A |
| `apps/worker/src/services/analytics-sync.ts` | 新規 | B〜D |
| `apps/worker/src/routes/analytics.ts` | 新規 | A〜D |
| `apps/worker/src/cron/index.ts` | 変更 | A〜D |
| `apps/web/src/app/channels/[id]/analytics/page.tsx` | 新規 | B〜D |
| `apps/web/src/app/videos/[id]/page.tsx` | 変更 | A |
| `apps/web/src/components/dashboard/` | 変更 | B |
| `packages/mcp/src/tools/analytics.ts` | 新規 | B〜D |
| `packages/mcp/src/index.ts` | 変更 | B〜D |
