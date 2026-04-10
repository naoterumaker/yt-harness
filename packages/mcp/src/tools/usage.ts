import type { ToolDefinition } from "../types.js";

export const usageTools: ToolDefinition[] = [
  {
    name: "get_quota",
    description:
      "チャンネルの今日のAPI Quota使用状況を取得します（使用量・残量・上限）。\nGet today's API quota usage for a channel (used, remaining, limit).",
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
      return client.get(`/api/channels/${args.channel_id}/usage`);
    },
  },
  {
    name: "get_daily_usage",
    description:
      "過去1週間の日別Quota使用履歴を取得します。\nGet daily quota usage history for the past week.",
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
      return client.get(
        `/api/channels/${args.channel_id}/usage/history`,
      );
    },
  },
];
