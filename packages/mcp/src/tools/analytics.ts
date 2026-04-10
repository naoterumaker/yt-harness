import type { ToolDefinition } from "../types.js";

export const analyticsTools: ToolDefinition[] = [
  {
    name: "get_analytics",
    description:
      "YouTube Analyticsデータを取得します。typeで'channel'または'video'を指定し、日付範囲やvideo_idでフィルタできます。\nGet YouTube Analytics data. Specify type as 'channel' or 'video', with optional date range and video_id filter.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        type: {
          type: "string",
          enum: ["channel", "video"],
          description:
            "分析タイプ: channel（チャンネル全体）またはvideo（動画別） / Analytics type",
        },
        start_date: {
          type: "string",
          description:
            "開始日（YYYY-MM-DD、省略時は2020-01-01） / Start date (default: 2020-01-01)",
        },
        end_date: {
          type: "string",
          description:
            "終了日（YYYY-MM-DD、省略時は今日） / End date (default: today)",
        },
        video_id: {
          type: "string",
          description:
            "動画IDでフィルタ（type=videoの場合） / Filter by video ID (for type=video)",
        },
      },
      required: ["channel_id", "type"],
    },
    execute: async (client, args) => {
      const params = new URLSearchParams();
      if (args.start_date) params.set("start_date", String(args.start_date));
      if (args.end_date) params.set("end_date", String(args.end_date));
      if (args.video_id) params.set("video_id", String(args.video_id));
      const qs = params.toString() ? `?${params.toString()}` : "";
      return client.get(
        `/api/channels/${args.channel_id}/analytics/${args.type}${qs}`,
      );
    },
  },
];
