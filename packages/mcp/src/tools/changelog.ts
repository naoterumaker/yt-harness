import type { ToolDefinition } from "../types.js";

export const changelogTools: ToolDefinition[] = [
  {
    name: "add_change_log",
    description:
      "施策ログを記録します。サムネイル変更、タイトル変更などの施策をログに残し、アナリティクスへの影響を追跡できます。\nLog a change for impact tracking. Record thumbnail changes, title edits, etc. to correlate with analytics shifts.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "string",
          description:
            "動画ID（省略時はチャンネル全体の施策） / Video ID (omit for channel-level changes)",
        },
        change_type: {
          type: "string",
          enum: [
            "thumbnail",
            "title",
            "description",
            "tags",
            "end_screen",
            "card",
            "chapter",
            "pinned_comment",
            "other",
          ],
          description: "施策の種別 / Type of change",
        },
        changed_at: {
          type: "string",
          description:
            "施策実施日時（YYYY-MM-DD or ISO 8601） / When the change was made",
        },
        effective_analytics_date: {
          type: "string",
          description:
            "効果が反映されるアナリティクス日（YYYY-MM-DD） / Analytics date when impact is expected",
        },
        note: {
          type: "string",
          description: "メモ / Note about the change",
        },
        before_value: {
          type: "string",
          description: "変更前の値 / Value before the change",
        },
        after_value: {
          type: "string",
          description: "変更後の値 / Value after the change",
        },
        impact_score: {
          type: "number",
          description:
            "影響度スコア（-1.0〜1.0） / Impact score (-1.0 to 1.0)",
        },
        created_by: {
          type: "string",
          description:
            "作成者（省略時は'mcp'） / Created by (default: 'mcp')",
        },
      },
      required: ["channel_id", "change_type", "changed_at"],
    },
    execute: async (client, args) => {
      return client.post(`/api/channels/${args.channel_id}/changelog`, {
        video_id: args.video_id,
        change_type: args.change_type,
        changed_at: args.changed_at,
        effective_analytics_date: args.effective_analytics_date,
        note: args.note,
        before_value: args.before_value,
        after_value: args.after_value,
        impact_score: args.impact_score,
        created_by: args.created_by,
      });
    },
  },
  {
    name: "get_change_log",
    description:
      "施策ログ一覧を取得します。日付範囲や動画IDでフィルタできます。グラフ上のマーカーとして使用し、施策とアナリティクスの相関を確認できます。\nGet change log entries. Filter by date range or video ID. Use as graph markers to correlate changes with analytics shifts.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        start_date: {
          type: "string",
          description:
            "開始日（YYYY-MM-DD） / Start date for filtering",
        },
        end_date: {
          type: "string",
          description: "終了日（YYYY-MM-DD） / End date for filtering",
        },
        video_id: {
          type: "string",
          description:
            "動画IDでフィルタ / Filter by video ID",
        },
      },
      required: ["channel_id"],
    },
    execute: async (client, args) => {
      const params = new URLSearchParams();
      if (args.start_date) params.set("start_date", String(args.start_date));
      if (args.end_date) params.set("end_date", String(args.end_date));
      if (args.video_id) params.set("video_id", String(args.video_id));
      const qs = params.toString() ? `?${params.toString()}` : "";
      return client.get(`/api/channels/${args.channel_id}/changelog${qs}`);
    },
  },
];
