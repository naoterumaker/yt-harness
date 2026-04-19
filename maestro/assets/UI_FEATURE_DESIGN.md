# YouTube Harness — UI/UX 機能設計書

> 作成日: 2026-04-19
> 対象ブランチ: main
> 監査ベースライン: 動画詳細10% / コメント85% / ゲート50% / シーケンス0% / プレイリスト0% / 分析60% / 登録者70% / ダッシュボード95%

---

## 設計原則

1. **実データ優先** — ダミーデータは一切残さない。APIが未接続なら「データなし」プレースホルダーを表示する
2. **エッジケース明示** — 空状態・エラー・ローディングを全コンポーネントで必ず処理する
3. **段階的拡張** — 今フェーズはグラフ・インタラクション、次フェーズはモーダル・ドラッグ＆ドロップ
4. **API型安全** — `src/lib/api.ts` の型定義と完全に一致させる

---

## 1. 動画詳細ページ `/videos/[id]`

> 現状: 10% 完成（全ダミーデータ）

### 1-1. 表示内容

| エリア | 内容 | データソース |
|--------|------|-------------|
| ヘッダー | サムネイル（16:9、最大 640px幅）、ステータスバッジ | `videos.thumbnail_url`, `videos.status` |
| タイトル | インラインテキスト（クリックで `<input>` 化） | `videos.title` |
| 説明文 | 折りたたみ式テキストエリア（200文字で切り捨て→「続きを読む」） | `videos.description` |
| タグ | バッジ一覧（将来: クリックで削除） | `videos.tags` ※DB拡張後 |
| ステータスバッジ | 公開 / 非公開 / 限定公開 / 予約済み（色分け） | `videos.status` |

### 1-2. メトリクスカード（4枚）

| カード | 値 | サブテキスト |
|--------|-----|------------|
| 再生回数 | `view_count` | 全期間累計 |
| 高評価数 | `like_count` | 高評価率（like/view × 100）% |
| コメント数 | `comment_count` | うち保留中 N 件（DBクエリ） |
| 平均視聴時間 | `avg_view_duration` | `video_metrics_snapshots` から最新値 |

### 1-3. メトリクス推移グラフ

- ライブラリ: `recharts` (LineChart)
- X軸: 日付（`snapshot_date`）、Y軸: 再生回数
- 2本折れ線: 再生回数（青）、いいね数（緑）
- 期間セレクター: 7日 / 28日 / 90日（ページ上部）
- ホバー時ツールチップ: 日付 + 各指標値

### 1-4. コメント一覧（サマリー）

- 最新10件を表示（`/api/channels/:channelId/comments?video_id=XXX&limit=10`）
- 「コメントをすべて見る」リンク → `/comments?videoId=XXX`

### 1-5. アクション

| ボタン | 処理 | API |
|--------|------|-----|
| 保存 | タイトル・説明文をPUT | `PUT /api/channels/:channelId/videos/:id` |
| 同期 | YouTubeから最新データ取得 | `POST /api/channels/:channelId/videos/:id/sync` |

### 1-6. APIエンドポイント

```
GET  /api/channels/:channelId/videos/:id
GET  /api/channels/:channelId/analytics/videos/:videoId/snapshots?days=28
GET  /api/channels/:channelId/comments?video_id=:videoId&limit=10
PUT  /api/channels/:channelId/videos/:id
POST /api/channels/:channelId/videos/:id/sync   ← Worker実装が必要
```

### 1-7. エッジケース

| 状況 | 表示 |
|------|------|
| 動画IDが存在しない | 404カード「この動画は見つかりませんでした」+ 動画一覧へ戻るリンク |
| サムネイルが null | グレー背景プレースホルダー（アスペクト比 16:9 維持） |
| スナップショットが0件 | グラフエリアに「メトリクスデータがありません（同期してください）」 |
| 同期APIが失敗 | トースト通知「同期に失敗しました: {エラー詳細}」 |
| 保存中 | ボタンをスピナー+無効化、誤操作防止 |

### 1-8. 実装タスク

- [ ] `fetchVideo(channelId, videoId)` を `api.ts` に追加（型: `Video`）
- [ ] `fetchVideoSnapshots(channelId, videoId, days)` を `api.ts` に追加
- [ ] 動画詳細ページをサーバーコンポーネントからクライアントコンポーネントに変更（`'use client'`）
- [ ] `useChannel()` でチャンネルIDを取得し、動画データをAPI fetchで取得
- [ ] サムネイル表示コンポーネント作成（null時のフォールバック付き）
- [ ] インライン編集対応: タイトル・説明文フィールドを `useState` + `onBlur` 保存
- [ ] メトリクスカード4枚をAPIデータで描画
- [ ] `recharts` パッケージを `apps/web` に追加（`pnpm add recharts`）
- [ ] `VideoMetricsChart` コンポーネント作成（LineChart、期間セレクター付き）
- [ ] コメントサマリー一覧コンポーネント作成（最新10件）
- [ ] 保存ボタン（PUT）の送信処理実装
- [ ] 同期ボタンの送信処理実装（Worker APIエンドポイント確認後）
- [ ] 404エラーハンドリング（`ApiError` status===404 分岐）
- [ ] ローディング・エラー・空状態のUI実装

---

## 2. コメントページ `/comments`

> 現状: 85% 完成（モデレーション未実装、ページネーションなし、全文表示なし）

### 2-1. 表示内容

| カラム | 内容 |
|--------|------|
| コメント | 先頭100文字 + 「続きを読む」展開ボタン |
| 動画 | `video_id`（将来: 動画タイトルに差し替え） |
| 投稿者 | `author_display_name` |
| 投稿日時 | `published_at`（`ja-JP` フォーマット） |
| ステータス | モデレーション状態バッジ（承認済み / 保留中 / 拒否） |
| アクション | 承認 / 保留 / 拒否 ボタン（3ボタン） |

### 2-2. ページネーション

- 1ページあたり50件
- `offset` / `limit` クエリパラメータを Worker API に追加（実装必要）
- 前へ / 次へ ボタン + 「N件中 M-K件を表示」テキスト
- URLパラメータ `?page=N` でブックマーク可能

### 2-3. フィルター

| フィルター | UI | パラメータ |
|-----------|-----|-----------|
| 動画別 | `<select>` ドロップダウン（動画タイトル一覧） | `video_id=XXX` |
| ステータス別 | タブ（全件 / 保留中 / 承認済み / 拒否済み） | `status=pending` 等 |

### 2-4. コメント全文表示

- デフォルト: 100文字で切り捨て + 「続きを読む」ボタン
- 展開: `isExpanded` ステート、「折りたたむ」ボタン
- 改行 (`\n`) を `<br>` に変換して表示

### 2-5. モデレーション

```
POST /api/channels/:channelId/comments/:commentId/moderate
Body: { "status": "approved" | "held" | "rejected" }
```

- 操作後: 楽観的UI更新（ローカルステート即時反映）
- 失敗時: トースト通知でロールバック

### 2-6. 返信フォーム

- テーブル行の「返信」ボタンクリック → 行の直下にインラインフォームを展開
- `<textarea>` + 送信ボタン
- `POST /api/channels/:channelId/comments` Body: `{ parent_comment_id, text, video_id }`
- 送信後: コメントリストを再フェッチ

### 2-7. APIエンドポイント

```
GET  /api/channels/:channelId/comments?offset=0&limit=50&video_id=XXX&status=pending
POST /api/channels/:channelId/comments/:commentId/moderate   ← Worker追加必要
POST /api/channels/:channelId/comments                       ← 返信
```

### 2-8. エッジケース

| 状況 | 表示 |
|------|------|
| コメントが0件 | 「コメントがありません」空状態カード |
| モデレーションAPI失敗 | トースト「モデレーションに失敗しました」+ ステート巻き戻し |
| 返信送信失敗 | インラインエラーメッセージ |
| フィルター結果が0件 | 「該当するコメントがありません」 |

### 2-9. 実装タスク

- [ ] Worker APIに `offset` / `limit` クエリパラメータを追加（`apps/worker/src/routes/comments.ts`）
- [ ] Worker APIに `video_id` / `status` フィルターパラメータを追加
- [ ] `fetchComments` に `offset`, `limit`, `videoId`, `status` パラメータを追加（`api.ts`）
- [ ] `moderateComment(channelId, commentId, status)` を `api.ts` に追加
- [ ] `replyComment(channelId, body)` を `api.ts` に追加
- [ ] コメントページをページネーション対応に書き換え（ページステート管理）
- [ ] フィルターUI実装（動画別 select、ステータス別タブ）
- [ ] コメント全文展開ロジック実装（`isExpanded` ステート per comment）
- [ ] モデレーションボタン3つ（承認 / 保留 / 拒否）実装
- [ ] 楽観的UI更新（モデレーション操作の即時反映）
- [ ] 返信フォーム（インライン展開）実装
- [ ] Worker側に `POST /comments/:id/moderate` ルート追加
- [ ] ページネーション前後ボタン + カウント表示UI

---

## 3. ゲート作成フォーム `/gates/new`

> 現状: 50% 完成（送信処理なし）

### 3-1. フォームフィールド

| フィールド | UI部品 | バリデーション |
|-----------|--------|--------------|
| ゲート名 | `<input type="text">` | 必須、最大100文字 |
| 対象動画 | `<select>`（チャンネルの動画一覧） | 任意（空 = 全動画対象） |
| トリガータイプ | `<select>` | 必須: `keyword` / `any_comment` / `new_subscriber` |
| キーワード | `<input type="text">` カンマ区切り | `trigger===keyword` のとき必須 |
| アクションタイプ | `<select>` | 必須: `reply` / `dm` |
| 返信テンプレート | `<textarea rows={5}>` | 必須、変数 `{username}` `{link}` 利用可 |
| 当選確率 | `<input type="range" 0-100>` + 数値表示 | 0〜100の整数 |
| ホットウィンドウ | `<input type="number">` 分単位 | 任意、正の整数 |
| ポーリング間隔 | `<input type="number">` 分単位 | 任意、最小5分 |

### 3-2. テンプレートプレビュー

- 返信テンプレート入力エリアの直下にリアルタイムプレビューを表示
- 変数を実値に差し替え:
  - `{username}` → `田中 太郎（サンプル）`
  - `{link}` → `https://example.com/resource`
- 変数がテンプレート内に存在しない場合は黄色警告バッジ「`{link}` が未使用です」

### 3-3. 送信処理

```
POST /api/channels/:channelId/gates
Body: {
  name, video_id, trigger, trigger_keyword,
  action, reply_template, lottery_rate,
  hot_window_minutes, polling_interval_minutes
}
Response: { gate: CommentGate }
```

- 送信中: ボタンをスピナー + 無効化
- 成功: `/gates` にリダイレクト + 「ゲートを作成しました」トースト
- 失敗: インラインエラーバナー（フィールドレベルでのエラーも表示）

### 3-4. バリデーション

- クライアントサイド: `onSubmit` 時にフィールド検証
- エラー表示: フィールド直下に赤テキスト
- `trigger === 'keyword'` かつ `trigger_keyword` が空 → 「キーワードを入力してください」
- `lottery_rate > 100` → 「0〜100の範囲で入力してください」
- `polling_interval_minutes < 5` → 「最小5分を指定してください」

### 3-5. エッジケース

| 状況 | 処理 |
|------|------|
| チャンネル未選択 | フォーム全体をグレーアウト + 「チャンネルを選択してください」 |
| API重複エラー（409） | 「同名のゲートが既に存在します」 |
| ネットワークエラー | 「送信に失敗しました。再試行してください」 |
| テンプレート変数なし | 「テンプレートに変数が含まれていません。意図的ですか？」確認ダイアログ |

### 3-6. 実装タスク

- [ ] `createGate(channelId, payload)` を `api.ts` に追加
- [ ] `fetchVideos` で動画一覧を取得し、対象動画 `<select>` に反映
- [ ] `handleSubmit` 関数実装（バリデーション → API送信 → リダイレクト）
- [ ] `useRouter` で成功時 `/gates` へリダイレクト
- [ ] テンプレートプレビューコンポーネント実装（変数置換ロジック）
- [ ] 未使用変数の警告バッジ実装
- [ ] フィールドレベルバリデーション実装（`useState` でエラーメッセージ管理）
- [ ] ホットウィンドウ・ポーリング間隔フィールド追加
- [ ] 送信中ローディング状態実装
- [ ] キャンセルボタンで `/gates` に遷移
- [ ] チャンネル未選択時のガード表示

---

## 4. シーケンスページ `/sequences`

> 現状: 0% 完成（全ダミーデータ）

### 4-1. 一覧ページ

| カラム | 内容 |
|--------|------|
| 名前 | シーケンス名（クリックで詳細へ） |
| トリガー | `trigger` バッジ（新規登録者 / ゲートトリガー / 手動等） |
| ステップ数 | `steps` の件数（DBカウント） |
| 登録数 | `enrollments` の件数 |
| ステータス | 有効 / 一時停止 バッジ |
| アクション | 有効化 / 停止 トグル、編集リンク |

ヘッダー右: 「新規シーケンス作成」ボタン → `/sequences/new`

### 4-2. 新規作成フォーム `/sequences/new`

| フィールド | UI | バリデーション |
|-----------|-----|--------------|
| シーケンス名 | `<input>` | 必須 |
| トリガータイプ | `<select>` | 必須 |
| 説明 | `<textarea>` | 任意 |

送信: `POST /api/channels/:channelId/sequences`
成功後: `/sequences/:id` にリダイレクト（ステップ追加ページへ）

### 4-3. 詳細・ステップエディタ `/sequences/[id]`

**ステップ一覧**（上から順に実行）:
- ステップカード: `delay_minutes`（「N分後」表示）+ `message_template`（プレビュー付き）
- 順序変更: ↑ / ↓ ボタン（ドラッグ不要）
- 削除ボタン（確認なしで即時削除 → トースト「削除しました・元に戻す」）

**ステップ追加フォーム**（ページ末尾固定）:
| フィールド | UI |
|-----------|-----|
| 遅延時間 | `<input type="number">` 分単位 + ラベル「前のステップからN分後」 |
| メッセージテンプレート | `<textarea>` + 変数プレビュー（{username} 等） |

送信: `POST /api/channels/:channelId/sequences/:id/steps`

### 4-4. APIエンドポイント

```
GET    /api/channels/:channelId/sequences
POST   /api/channels/:channelId/sequences
GET    /api/channels/:channelId/sequences/:id
PUT    /api/channels/:channelId/sequences/:id
DELETE /api/channels/:channelId/sequences/:id
GET    /api/channels/:channelId/sequences/:id/steps
POST   /api/channels/:channelId/sequences/:id/steps
PUT    /api/channels/:channelId/sequences/:id/steps/:stepId
DELETE /api/channels/:channelId/sequences/:id/steps/:stepId
```

### 4-5. 型定義（追加必要）

```typescript
// api.ts に追加
export interface Sequence {
  id: number;
  channel_id: string;
  name: string;
  trigger: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: number;
  sequence_id: number;
  step_order: number;
  delay_minutes: number;
  message_template: string;
  created_at: string;
}
```

### 4-6. エッジケース

| 状況 | 表示 |
|------|------|
| シーケンスが0件 | 「シーケンスがありません」空状態 + 作成ボタン |
| ステップが0件 | 「ステップを追加してください」ガイドテキスト |
| ステップ削除（1件のみ） | 削除後は空状態 + 「最低1ステップ必要です」ヒント |
| シーケンスが存在しない | 404カード |

### 4-7. 実装タスク

- [ ] `Sequence`, `SequenceStep` 型を `api.ts` に追加
- [ ] `fetchSequences(channelId)` を `api.ts` に追加
- [ ] `createSequence(channelId, payload)` を `api.ts` に追加
- [ ] `fetchSequence(channelId, id)` を `api.ts` に追加
- [ ] `fetchSequenceSteps(channelId, sequenceId)` を `api.ts` に追加
- [ ] `addSequenceStep(channelId, sequenceId, payload)` を `api.ts` に追加
- [ ] `updateSequenceStep(channelId, sequenceId, stepId, payload)` を `api.ts` に追加
- [ ] `deleteSequenceStep(channelId, sequenceId, stepId)` を `api.ts` に追加
- [ ] シーケンス一覧ページをAPI接続に書き換え（ダミーデータ削除）
- [ ] `sequences/new/page.tsx` 新規作成フォームページ作成
- [ ] `sequences/[id]/page.tsx` 詳細・ステップエディタページ作成
- [ ] ↑↓ボタンによるステップ順序変更ロジック実装
- [ ] インライン削除 + トースト「元に戻す」実装
- [ ] Worker APIにシーケンス・ステップのCRUDルート確認/追加

---

## 5. プレイリストページ `/playlists`

> 現状: 0% 完成（全ダミーデータ）

### 5-1. 一覧ページ

| カラム | 内容 |
|--------|------|
| サムネイル | プレイリストサムネイル（50×28px）または グレープレースホルダー |
| タイトル | プレイリスト名（クリックで詳細へ） |
| 動画数 | `video_count` |
| 公開設定 | 公開 / 非公開 バッジ |
| 最終更新 | `updated_at` |
| アクション | 編集 / 削除 |

ヘッダー右: 「YouTubeから同期」ボタン + 「新規作成」ボタン

### 5-2. 同期処理

```
POST /api/channels/:channelId/playlists/sync   ← Worker実装が必要
```

- 処理中: ボタンをスピナー + 「同期中...」
- 成功: 「N件のプレイリストを同期しました」トースト + リスト再フェッチ
- 失敗: 「同期に失敗しました: {詳細}」トースト

### 5-3. 新規作成モーダル

| フィールド | UI |
|-----------|-----|
| タイトル | `<input>` 必須 |
| 説明文 | `<textarea>` 任意 |
| 公開設定 | `<select>`: 公開 / 非公開 / 限定公開 |

送信: `POST /api/channels/:channelId/playlists`
成功後: モーダルを閉じてリスト再フェッチ

### 5-4. 詳細ページ `/playlists/[id]`

- プレイリストメタデータ（タイトル・説明・公開設定）表示 + 編集
- 動画一覧テーブル（順序番号 / サムネイル / タイトル / 再生回数 / 追加日）
- 動画削除ボタン: `DELETE /api/channels/:channelId/playlists/:id/videos/:videoId`
- 「YouTubeで開く」リンク（外部リンク）

### 5-5. 型定義（追加必要）

```typescript
export interface Playlist {
  id: number;
  channel_id: string;
  playlist_id: string;
  title: string;
  description: string | null;
  privacy_status: string;
  video_count: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}
```

### 5-6. エッジケース

| 状況 | 表示 |
|------|------|
| プレイリスト0件 | 空状態カード + 「YouTube同期」ガイドボタン |
| 同期APIが未実装 | ボタン無効化 + 「近日実装予定」ツールチップ |
| 削除確認 | 確認ダイアログ「削除すると元に戻せません」 |
| 動画0件 | 「このプレイリストに動画がありません」 |

### 5-7. 実装タスク

- [ ] `Playlist` 型を `api.ts` に追加
- [ ] `fetchPlaylists(channelId)` を `api.ts` に追加
- [ ] `createPlaylist(channelId, payload)` を `api.ts` に追加
- [ ] `syncPlaylists(channelId)` を `api.ts` に追加
- [ ] `deletePlaylist(channelId, playlistId)` を `api.ts` に追加
- [ ] プレイリスト一覧ページをAPI接続に書き換え（ダミーデータ削除）
- [ ] 新規作成モーダルコンポーネント実装（`useState` でモーダル開閉制御）
- [ ] 同期ボタン処理実装（ローディング状態付き）
- [ ] `playlists/[id]/page.tsx` 詳細ページ作成
- [ ] 詳細ページの動画一覧実装（`GET /playlists/:id/videos`）
- [ ] Worker APIに `POST /playlists/sync` ルート追加
- [ ] 削除確認ダイアログ実装

---

## 6. 分析ページ `/analytics`

> 現状: 60% 完成（グラフなし、Recharts未導入）

### 6-1. レイアウト構成

```
[期間セレクター: 7日 / 28日 / 90日 / カスタム]

[メトリクスカード ×4: インプレッション / CTR / AVD / 総視聴時間]

[再生回数×CTR 折れ線グラフ（2軸）]  [トラフィックソース 積み上げ棒グラフ]

[登録者推移 折れ線グラフ]            [動画別ランキングテーブル]

[視聴者属性: 年齢（横棒）/ 性別（ドーナツ）/ 国TOP10（棒）]
```

### 6-2. Recharts 導入

```bash
pnpm add recharts
pnpm add @types/recharts -D  # 不要の場合あり（型同梱）
```

### 6-3. グラフ仕様

**再生回数 × CTR 折れ線グラフ（`VideoTrendChart`）**
- X軸: 日付
- 左Y軸: 再生回数（青線）
- 右Y軸: CTR % （オレンジ線）
- データ: `video_metrics_snapshots` 集計
- 施策マーカー: `change_log` テーブルの日付に `▲` マーカーを表示（`ReferenceArea` or `ReferenceLine`）

**トラフィックソース 積み上げ棒グラフ（`TrafficSourceChart`）**
- X軸: 日付（7日分）
- Y軸: 再生回数
- 系列: 検索 / おすすめ / 外部 / チャンネルページ / その他（5色）
- データ: Analytics API `trafficSourceType` ディメンション

**登録者推移 折れ線グラフ**
- `subscriber_snapshots` から取得
- X軸: 日付、Y軸: 登録者数（絶対値）
- ツールチップ: 日付 + 登録者数 + 前日比（±N）

**視聴者属性**
- 年齢分布: `BarChart` 横棒（`AGE_13_17` 〜 `AGE_65_` を日本語ラベル変換）
- 性別: `PieChart` ドーナツ（男性 / 女性 / 不明）
- 国TOP10: `BarChart` 横棒（国コード → 国名変換）

### 6-4. メトリクスカード（4枚）

| カード | 値 | 前期比 |
|--------|-----|--------|
| インプレッション | 期間内合計 | 前同期間比 ±% |
| CTR | 期間平均 % | 前同期間比 ±pp |
| 平均視聴時間（AVD） | mm:ss 形式 | 前同期間比 ±% |
| 総視聴時間 | 時間単位 | 前同期間比 ±% |

前期比の色: 正 → 緑 (`text-green-400`)、負 → 赤 (`text-red-400`)

### 6-5. 期間セレクター

- ボタングループ: 7日 / 28日 / 90日 / カスタム
- カスタム選択時: カレンダーピッカー（`<input type="date">` 2枚）
- URLパラメータ `?period=7d&from=2026-04-01&to=2026-04-19` でブックマーク可能

### 6-6. 動画別ランキングテーブル

| カラム | ソート |
|--------|--------|
| 順位 | — |
| タイトル | — |
| 再生回数 | ▲▼ |
| CTR | ▲▼ |
| 平均視聴時間 | ▲▼ |
| インプレッション | ▲▼ |

デフォルトソート: 再生回数降順

### 6-7. 施策マーカー

```typescript
// change_log テーブルから取得
GET /api/channels/:channelId/change-log?from=YYYY-MM-DD&to=YYYY-MM-DD
// → グラフの対応日付に <ReferenceLine x={date} stroke="#fbbf24" label="▲" />
```

### 6-8. APIエンドポイント

```
GET /api/channels/:channelId/analytics/channel?start_date=X&end_date=Y
GET /api/channels/:channelId/analytics/summary?days=7
GET /api/channels/:channelId/analytics/videos/:videoId/snapshots?days=28
GET /api/channels/:channelId/subscriber-snapshots?days=90
GET /api/channels/:channelId/change-log?from=X&to=Y       ← 将来実装
```

### 6-9. エッジケース

| 状況 | 表示 |
|------|------|
| Analytics API が利用不可 | 黄色バナー「YouTube Analytics APIが利用できません」、ローカルデータで代替表示 |
| 期間内データ0件 | グラフに「選択期間にデータがありません」メッセージ |
| カスタム期間: 終了 < 開始 | 「終了日は開始日以降を指定してください」バリデーション |
| データ取得中 | グラフエリアにスケルトンローダー（アニメーション） |

### 6-10. 実装タスク

- [ ] `pnpm add recharts` を `apps/web` に追加
- [ ] `VideoTrendChart` コンポーネント作成（LineChart 2軸）
- [ ] `TrafficSourceChart` コンポーネント作成（StackedBarChart）
- [ ] `SubscriberTrendChart` コンポーネント作成（LineChart）
- [ ] `AudienceAgeChart` コンポーネント作成（横 BarChart）
- [ ] `AudienceGenderChart` コンポーネント作成（PieChart ドーナツ）
- [ ] `AudienceCountryChart` コンポーネント作成（横 BarChart TOP10）
- [ ] メトリクスカードに前期比表示追加（±% テキスト、色分け）
- [ ] 期間セレクターにカスタム日付ピッカー追加
- [ ] URLパラメータで期間状態を同期（`useSearchParams`）
- [ ] `fetchAnalyticsSummary(channelId, days)` を `api.ts` に追加
- [ ] `fetchSubscriberSnapshots(channelId, days)` を `api.ts` に追加
- [ ] 動画別ランキングテーブルにソート機能追加（`useState` でソートキー管理）
- [ ] グラフにスケルトンローダー実装
- [ ] Analytics API 未接続時のフォールバック処理確認

---

## 7. 登録者ページ `/subscribers`

> 現状: 70% 完成（推移グラフなし）

### 7-1. ページ上部: サマリーカード

| カード | 値 |
|--------|-----|
| 総登録者数 | `subscriber_snapshots` の最新値 |
| 今月の増減 | 今月1日〜本日の差分 |
| アクティブ率 | `is_active === true` の割合 |

### 7-2. 推移グラフ（`SubscriberTrendChart`）

- `recharts` `LineChart`
- X軸: 日付（`subscriber_snapshots.snapshot_date`）
- Y軸: 登録者数
- ツールチップ: 日付 + 登録者数 + 前日比 ±N
- 期間セレクター: 30日 / 90日 / 1年

### 7-3. 登録者テーブル（既存機能 拡張）

追加カラム:
- タグ: 登録者に付与されたタグバッジ（複数可）
- シーケンス: 参加中のシーケンス名（複数可）

### 7-4. タグ管理 UI

- テーブル行の「タグ」セルをクリック → インラインタグ入力（`input` + Enter で追加）
- タグバッジの × をクリック → タグ削除
- API:
  ```
  POST   /api/channels/:channelId/subscribers/:subscriberId/tags
  DELETE /api/channels/:channelId/subscribers/:subscriberId/tags/:tagId
  ```

### 7-5. 同期ボタン

```
POST /api/channels/:channelId/subscribers/sync
```

- 同期後: 「N人の登録者を同期しました」トースト + リスト再フェッチ

### 7-6. APIエンドポイント

```
GET  /api/channels/:channelId/subscribers
GET  /api/channels/:channelId/subscriber-snapshots?days=90
POST /api/channels/:channelId/subscribers/sync           ← Worker確認必要
POST /api/channels/:channelId/subscribers/:id/tags
DELETE /api/channels/:channelId/subscribers/:id/tags/:tagId
```

### 7-7. エッジケース

| 状況 | 表示 |
|------|------|
| スナップショット0件 | グラフ非表示 + 「同期してください」案内 |
| 同期失敗 | 「同期に失敗しました」トースト |
| タグ追加重複 | 「既に追加されています」インラインエラー |

### 7-8. 実装タスク

- [ ] サマリーカード3枚（総登録者数・今月増減・アクティブ率）実装
- [ ] `fetchSubscriberSnapshots(channelId, days)` を `api.ts` に追加
- [ ] `SubscriberTrendChart` コンポーネント作成（recharts LineChart）
- [ ] グラフ期間セレクター（30日 / 90日 / 1年）実装
- [ ] テーブルにタグカラム追加
- [ ] インラインタグ入力 UI 実装
- [ ] タグ追加・削除 API 接続実装
- [ ] 同期ボタン処理実装（Worker APIエンドポイント確認）
- [ ] `recharts` がまだ未追加なら `pnpm add recharts` 実行

---

## 8. ダッシュボード `/dashboard`

> 現状: 95% 完成（CTR / AVD カードなし）

### 8-1. 追加メトリクスカード

現在の4枚（チャンネル名 / 総再生回数 / 動画数 / コメント数）に以下3枚を追加:

| カード | 値 | データソース |
|--------|-----|------------|
| CTR（直近7日） | N.N% | `GET /analytics/summary?days=7` の `ctr` フィールド |
| 平均視聴時間 | mm:ss | 同上 `avg_view_duration` |
| インプレッション | N万 | 同上 `impressions` |

合計7枚 → グリッドを `lg:grid-cols-4` から `lg:grid-cols-4` に維持（2行になる）

### 8-2. アクティブゲート数

- ダッシュボードの「最近のコメント」セクション横に「アクティブゲート数」カード
- `GET /api/channels/:channelId/gates` でフィルター `is_active === true` の件数

### 8-3. APIエンドポイント追加

```
GET /api/channels/:channelId/analytics/summary?days=7
Response: {
  impressions: number,
  ctr: number,           // 0.0〜1.0
  avg_view_duration: number,  // 秒
  watch_time_hours: number
}
```

Worker側に `analytics/summary` エンドポイント追加が必要。

### 8-4. エッジケース

| 状況 | 表示 |
|------|------|
| Analytics API 未接続 | CTR / AVD カードを非表示（ではなく「—」表示） |
| summary API エラー | カードに「—」表示（他のカードに影響しない） |

### 8-5. 実装タスク

- [ ] `fetchAnalyticsSummary(channelId, days)` を `api.ts` に追加（型: `AnalyticsSummary`）
- [ ] `AnalyticsSummary` 型を `api.ts` に追加
- [ ] Worker APIに `GET /analytics/summary` ルート追加
- [ ] ダッシュボードに CTR カード追加（`useMemo` で summaryFetcher 追加）
- [ ] ダッシュボードに AVD カード追加（秒 → mm:ss 変換ユーティリティ作成）
- [ ] ダッシュボードに インプレッション カード追加
- [ ] アクティブゲート数カード追加（`fetchGates` 結果を is_active フィルター）
- [ ] `formatDuration(seconds)` ユーティリティを `utils.ts` に追加

---

## 共通コンポーネント・ユーティリティ

### 必要な新規コンポーネント

| コンポーネント | パス | 用途 |
|--------------|------|------|
| `Toast` | `components/ui/toast.tsx` | 全画面の通知 |
| `Modal` | `components/ui/modal.tsx` | プレイリスト作成等 |
| `ConfirmDialog` | `components/ui/confirm-dialog.tsx` | 削除確認 |
| `Skeleton` | `components/ui/skeleton.tsx` | ローディング状態 |
| `Pagination` | `components/ui/pagination.tsx` | コメント等のページング |
| `InlineEdit` | `components/ui/inline-edit.tsx` | タイトル・説明のインライン編集 |

### `utils.ts` に追加する関数

```typescript
// 秒 → mm:ss 変換
export function formatDuration(seconds: number): string

// 前期比 ± % テキスト生成
export function formatDelta(current: number, previous: number): string

// 変数プレースホルダー置換
export function interpolateTemplate(template: string, vars: Record<string, string>): string
```

### `api.ts` に追加が必要な関数（サマリー）

```typescript
fetchVideo(channelId, videoId)
fetchVideoSnapshots(channelId, videoId, days)
moderateComment(channelId, commentId, status)
replyComment(channelId, body)
createGate(channelId, payload)
fetchSequences(channelId)
createSequence(channelId, payload)
fetchSequence(channelId, id)
fetchSequenceSteps(channelId, sequenceId)
addSequenceStep(channelId, sequenceId, payload)
updateSequenceStep(channelId, sequenceId, stepId, payload)
deleteSequenceStep(channelId, sequenceId, stepId)
fetchPlaylists(channelId)
createPlaylist(channelId, payload)
syncPlaylists(channelId)
deletePlaylist(channelId, playlistId)
fetchAnalyticsSummary(channelId, days)
fetchSubscriberSnapshots(channelId, days)
syncSubscribers(channelId)
addSubscriberTag(channelId, subscriberId, tag)
deleteSubscriberTag(channelId, subscriberId, tagId)
```

---

## 実装優先順位マトリクス

| 優先度 | 機能 | 理由 |
|--------|------|------|
| P0 | ゲート作成フォーム（送信処理） | コアビジネスロジック、現状50%で送信不可 |
| P0 | ダッシュボード CTR/AVD カード | 95%完成、小変更で完成 |
| P1 | コメントページネーション | 大量データ時の必須機能 |
| P1 | コメントモデレーション | コンテンツ管理の基本機能 |
| P1 | 動画詳細ページ（API接続） | 現状10%、最も未完成 |
| P2 | 分析グラフ（Recharts）| データ可視化、インパクト大 |
| P2 | 登録者推移グラフ | 70%完成、グラフ追加のみ |
| P3 | シーケンスAPI接続 | 完全ダミー、工数大 |
| P3 | プレイリストAPI接続 | 完全ダミー、工数大 |

---

## Worker API 追加が必要なエンドポイント（バックエンド依存）

以下は Frontend 実装前に Worker 側の追加が必要なエンドポイント:

- [ ] `POST /api/channels/:channelId/videos/:id/sync` — 動画の手動同期
- [ ] `POST /api/channels/:channelId/comments/:id/moderate` — コメントモデレーション
- [ ] `GET /api/channels/:channelId/comments` に `offset`, `limit`, `video_id`, `status` クエリパラメータ追加
- [ ] `POST /api/channels/:channelId/playlists/sync` — プレイリスト同期
- [ ] `GET /api/channels/:channelId/analytics/summary?days=N` — 分析サマリー
- [ ] `GET /api/channels/:channelId/subscriber-snapshots` — 登録者スナップショット
- [ ] `POST /api/channels/:channelId/subscribers/sync` — 登録者同期
- [ ] シーケンス・ステップ CRUD ルート（確認が必要）
