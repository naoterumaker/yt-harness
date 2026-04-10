import type { ToolDefinition } from "../types.js";

export const videoTools: ToolDefinition[] = [
  {
    name: "get_video",
    description:
      "動画の詳細情報を取得します。\nGet detailed information about a specific video.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "number",
          description: "動画の内部ID / Internal video ID",
        },
      },
      required: ["channel_id", "video_id"],
    },
    execute: async (client, args) => {
      return client.get(
        `/api/channels/${args.channel_id}/videos/${args.video_id}`,
      );
    },
  },
  {
    name: "list_videos",
    description:
      "チャンネルの動画一覧を取得します。\nList all videos for a channel.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
      },
      required: ["channel_id"],
    },
    execute: async (client, args) => {
      return client.get(`/api/channels/${args.channel_id}/videos`);
    },
  },
  {
    name: "update_video",
    description:
      "動画の情報を更新します。\nUpdate video metadata.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "number",
          description: "動画の内部ID / Internal video ID",
        },
        title: {
          type: "string",
          description: "動画タイトル / Video title",
        },
        description: {
          type: "string",
          description: "動画説明文 / Video description",
        },
        status: {
          type: "string",
          description: "動画ステータス / Video status",
        },
      },
      required: ["channel_id", "video_id"],
    },
    execute: async (client, args) => {
      const { channel_id, video_id, ...body } = args;
      return client.put(
        `/api/channels/${channel_id}/videos/${video_id}`,
        body,
      );
    },
  },
  {
    name: "delete_video",
    description:
      "動画を削除します。\nDelete a video record.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "number",
          description: "動画の内部ID / Internal video ID",
        },
      },
      required: ["channel_id", "video_id"],
    },
    execute: async (client, args) => {
      return client.delete(
        `/api/channels/${args.channel_id}/videos/${args.video_id}`,
      );
    },
  },
  {
    name: "get_video_metrics",
    description:
      "動画のメトリクス（再生数・いいね数・コメント数）を更新します。\nUpdate video metrics (views, likes, comments).",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "number",
          description: "動画の内部ID / Internal video ID",
        },
        view_count: {
          type: "number",
          description: "再生回数 / View count",
        },
        like_count: {
          type: "number",
          description: "いいね数 / Like count",
        },
        comment_count: {
          type: "number",
          description: "コメント数 / Comment count",
        },
      },
      required: ["channel_id", "video_id", "view_count", "like_count", "comment_count"],
    },
    execute: async (client, args) => {
      const { channel_id, video_id, ...body } = args;
      return client.put(
        `/api/channels/${channel_id}/videos/${video_id}/metrics`,
        body,
      );
    },
  },
  {
    name: "rate_video",
    description:
      "動画を作成・更新（upsert）します。\nCreate or update a video record.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "string",
          description: "YouTube動画ID / YouTube video ID",
        },
        title: {
          type: "string",
          description: "動画タイトル / Video title",
        },
        description: {
          type: "string",
          description: "動画説明文 / Video description",
        },
      },
      required: ["channel_id"],
    },
    execute: async (client, args) => {
      const { channel_id, ...body } = args;
      return client.post(`/api/channels/${channel_id}/videos`, body);
    },
  },
  {
    name: "schedule_publish",
    description:
      "動画の公開スケジュールを設定します。\nSchedule a video for publication at a specific time.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "number",
          description: "動画の内部ID / Internal video ID",
        },
        scheduled_at: {
          type: "string",
          description:
            "公開予定日時（ISO 8601形式） / Scheduled publish time (ISO 8601)",
        },
      },
      required: ["channel_id", "video_id", "scheduled_at"],
    },
    execute: async (client, args) => {
      return client.post(
        `/api/channels/${args.channel_id}/videos/${args.video_id}/schedule`,
        { scheduled_at: args.scheduled_at },
      );
    },
  },
];
