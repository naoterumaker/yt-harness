import type { ToolDefinition } from "../types.js";

export const commentTools: ToolDefinition[] = [
  {
    name: "list_comments",
    description:
      "コメント一覧を取得します。video_idを指定すると特定動画のコメントのみ返します。\nList comments. Optionally filter by video_id.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "string",
          description: "動画IDでフィルタ（省略時は全コメント） / Filter by video ID (optional)",
        },
      },
      required: ["channel_id"],
    },
    execute: async (client, args) => {
      const qs = args.video_id ? `?video_id=${args.video_id}` : "";
      return client.get(`/api/channels/${args.channel_id}/comments${qs}`);
    },
  },
  {
    name: "insert_comment",
    description:
      "新しいコメントを投稿します。\nInsert a new comment.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "string",
          description: "コメント先の動画ID / Video ID to comment on",
        },
        text: {
          type: "string",
          description: "コメント本文 / Comment text",
        },
        author_name: {
          type: "string",
          description: "投稿者名 / Author name",
        },
        author_channel_id: {
          type: "string",
          description: "投稿者のチャンネルID / Author channel ID",
        },
      },
      required: ["channel_id", "video_id", "text"],
    },
    execute: async (client, args) => {
      const { channel_id, ...body } = args;
      return client.post(`/api/channels/${channel_id}/comments`, body);
    },
  },
  {
    name: "reply_comment",
    description:
      "コメントに返信します。parent_idを指定して返信コメントを作成します。\nReply to an existing comment by specifying parent_id.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        parent_id: {
          type: "string",
          description: "返信先コメントID / Parent comment ID",
        },
        video_id: {
          type: "string",
          description: "動画ID / Video ID",
        },
        text: {
          type: "string",
          description: "返信本文 / Reply text",
        },
      },
      required: ["channel_id", "parent_id", "video_id", "text"],
    },
    execute: async (client, args) => {
      const { channel_id, ...body } = args;
      return client.post(`/api/channels/${channel_id}/comments`, body);
    },
  },
  {
    name: "moderate_comment",
    description:
      "コメントを承認・保留・拒否します。\nModerate a comment (approve, hold, or reject).",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        comment_id: {
          type: "number",
          description: "コメントの内部ID / Internal comment ID",
        },
        status: {
          type: "string",
          enum: ["approved", "held", "rejected"],
          description:
            "モデレーション結果（approved/held/rejected） / Moderation status",
        },
      },
      required: ["channel_id", "comment_id", "status"],
    },
    execute: async (client, args) => {
      return client.post(
        `/api/channels/${args.channel_id}/comments/${args.comment_id}/moderate`,
        { status: args.status },
      );
    },
  },
  {
    name: "delete_comment",
    description:
      "コメントを削除します。\nDelete a comment.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        comment_id: {
          type: "number",
          description: "コメントの内部ID / Internal comment ID",
        },
      },
      required: ["channel_id", "comment_id"],
    },
    execute: async (client, args) => {
      return client.delete(
        `/api/channels/${args.channel_id}/comments/${args.comment_id}`,
      );
    },
  },
];
