import type { ToolDefinition } from "../types.js";

export const sequenceTools: ToolDefinition[] = [
  {
    name: "create_sequence",
    description:
      "コメントシーケンス（ステップメッセージの自動送信フロー）を作成します。\nCreate a comment sequence (automated step-message flow).",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        name: {
          type: "string",
          description: "シーケンス名 / Sequence name",
        },
        description: {
          type: "string",
          description: "シーケンスの説明 / Sequence description",
        },
      },
      required: ["channel_id", "name"],
    },
    execute: async (client, args) => {
      const { channel_id, ...body } = args;
      return client.post(
        `/api/channels/${channel_id}/sequences`,
        body,
      );
    },
  },
  {
    name: "add_step",
    description:
      "シーケンスにステップメッセージを追加します。\nAdd a step message to an existing sequence.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        sequence_id: {
          type: "number",
          description: "シーケンスの内部ID / Internal sequence ID",
        },
        step_number: {
          type: "number",
          description: "ステップ番号 / Step number",
        },
        message_template: {
          type: "string",
          description: "メッセージテンプレート / Message template",
        },
        delay_hours: {
          type: "number",
          description: "前ステップからの遅延時間（時間） / Delay in hours from previous step",
        },
      },
      required: ["channel_id", "sequence_id", "message_template"],
    },
    execute: async (client, args) => {
      const { channel_id, sequence_id, ...body } = args;
      return client.post(
        `/api/channels/${channel_id}/sequences/${sequence_id}/messages`,
        body,
      );
    },
  },
  {
    name: "list_sequences",
    description:
      "チャンネルのシーケンス一覧を取得します。\nList all sequences for a channel.",
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
      return client.get(`/api/channels/${args.channel_id}/sequences`);
    },
  },
];
