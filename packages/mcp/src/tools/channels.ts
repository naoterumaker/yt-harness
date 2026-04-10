import type { ToolDefinition } from "../types.js";

export const channelTools: ToolDefinition[] = [
  {
    name: "get_channel_info",
    description:
      "チャンネルの詳細情報を取得します。\nGet detailed information about a YouTube channel.",
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
      return client.get(`/api/channels/${args.channel_id}`);
    },
  },
  {
    name: "list_subscribers",
    description:
      "チャンネルの登録者一覧を取得します。\nList subscribers for a channel.",
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
        `/api/channels/${args.channel_id}/subscribers`,
      );
    },
  },
  {
    name: "subscriber_snapshots",
    description:
      "登録者数のスナップショット（推移）を取得します。\nGet subscriber count snapshots over time.",
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
        `/api/channels/${args.channel_id}/subscribers/snapshots`,
      );
    },
  },
];
