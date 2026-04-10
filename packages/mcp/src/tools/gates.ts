import type { ToolDefinition } from "../types.js";

export const gateTools: ToolDefinition[] = [
  {
    name: "create_gate",
    description:
      "コメントゲートを作成します。特定のコメントをトリガーに自動アクションを実行できます。\nCreate a comment gate. Triggers automated actions based on specific comments.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        video_id: {
          type: "string",
          description: "対象動画ID / Target video ID",
        },
        keyword: {
          type: "string",
          description: "トリガーキーワード / Trigger keyword",
        },
        reward_type: {
          type: "string",
          description: "報酬タイプ / Reward type",
        },
        reward_value: {
          type: "string",
          description: "報酬の値（URLなど） / Reward value (e.g. URL)",
        },
        lottery_rate: {
          type: "number",
          description: "当選確率（0.0-1.0） / Lottery rate (0.0-1.0)",
        },
      },
      required: ["channel_id"],
    },
    execute: async (client, args) => {
      const { channel_id, ...body } = args;
      return client.post(`/api/channels/${channel_id}/gates`, body);
    },
  },
  {
    name: "update_gate",
    description:
      "コメントゲートを更新します。\nUpdate an existing comment gate.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        gate_id: {
          type: "number",
          description: "ゲートの内部ID / Internal gate ID",
        },
        keyword: {
          type: "string",
          description: "トリガーキーワード / Trigger keyword",
        },
        reward_type: {
          type: "string",
          description: "報酬タイプ / Reward type",
        },
        reward_value: {
          type: "string",
          description: "報酬の値 / Reward value",
        },
        lottery_rate: {
          type: "number",
          description: "当選確率（0.0-1.0） / Lottery rate",
        },
        is_active: {
          type: "boolean",
          description: "有効/無効 / Active flag",
        },
      },
      required: ["channel_id", "gate_id"],
    },
    execute: async (client, args) => {
      const { channel_id, gate_id, ...body } = args;
      return client.put(
        `/api/channels/${channel_id}/gates/${gate_id}`,
        body,
      );
    },
  },
  {
    name: "list_gates",
    description:
      "チャンネルのコメントゲート一覧を取得します。\nList all comment gates for a channel.",
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
      return client.get(`/api/channels/${args.channel_id}/gates`);
    },
  },
  {
    name: "process_gates",
    description:
      "コメントゲートの処理を手動実行します。新しいコメントに対してゲート条件を評価します。\nManually trigger gate processing. Evaluates gate conditions against new comments.",
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
      return client.post(
        `/api/channels/${args.channel_id}/gates/process`,
      );
    },
  },
  {
    name: "verify_gate",
    description:
      "ゲートの配信履歴と分析データを取得します。\nGet gate delivery history and analytics.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        gate_id: {
          type: "number",
          description: "ゲートの内部ID / Internal gate ID",
        },
      },
      required: ["channel_id", "gate_id"],
    },
    execute: async (client, args) => {
      const [deliveries, analytics] = await Promise.all([
        client.get(
          `/api/channels/${args.channel_id}/gates/${args.gate_id}/deliveries`,
        ),
        client.get(
          `/api/channels/${args.channel_id}/gates/${args.gate_id}/analytics`,
        ),
      ]);
      return { deliveries, analytics };
    },
  },
];
