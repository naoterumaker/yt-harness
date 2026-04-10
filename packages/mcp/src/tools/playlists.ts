import type { ToolDefinition } from "../types.js";

export const playlistTools: ToolDefinition[] = [
  {
    name: "list_playlists",
    description:
      "チャンネルの再生リスト一覧を取得します。\nList all playlists for a channel.",
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
      return client.get(`/api/channels/${args.channel_id}/playlists`);
    },
  },
  {
    name: "create_playlist",
    description:
      "新しい再生リストを作成します。\nCreate a new playlist.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        title: {
          type: "string",
          description: "再生リスト名 / Playlist title",
        },
        description: {
          type: "string",
          description: "再生リストの説明 / Playlist description",
        },
        playlist_id: {
          type: "string",
          description: "YouTube再生リストID / YouTube playlist ID",
        },
      },
      required: ["channel_id", "title"],
    },
    execute: async (client, args) => {
      const { channel_id, ...body } = args;
      return client.post(`/api/channels/${channel_id}/playlists`, body);
    },
  },
  {
    name: "update_playlist",
    description:
      "再生リストの情報を更新します。\nUpdate playlist metadata.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        playlist_id: {
          type: "number",
          description: "再生リストの内部ID / Internal playlist ID",
        },
        title: {
          type: "string",
          description: "再生リスト名 / Playlist title",
        },
        description: {
          type: "string",
          description: "再生リストの説明 / Playlist description",
        },
      },
      required: ["channel_id", "playlist_id"],
    },
    execute: async (client, args) => {
      const { channel_id, playlist_id, ...body } = args;
      return client.put(
        `/api/channels/${channel_id}/playlists/${playlist_id}`,
        body,
      );
    },
  },
  {
    name: "delete_playlist",
    description:
      "再生リストを削除します。\nDelete a playlist.",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        playlist_id: {
          type: "number",
          description: "再生リストの内部ID / Internal playlist ID",
        },
      },
      required: ["channel_id", "playlist_id"],
    },
    execute: async (client, args) => {
      return client.delete(
        `/api/channels/${args.channel_id}/playlists/${args.playlist_id}`,
      );
    },
  },
  {
    name: "add_video_to_playlist",
    description:
      "再生リストに動画を追加します（YouTube APIを呼び出します）。\nAdd a video to a playlist (calls YouTube API).",
    inputSchema: {
      type: "object",
      properties: {
        channel_id: {
          type: "string",
          description: "チャンネルID / Channel ID",
        },
        playlist_id: {
          type: "number",
          description: "再生リストの内部ID / Internal playlist ID",
        },
        video_id: {
          type: "string",
          description: "追加するYouTube動画ID / YouTube video ID to add",
        },
      },
      required: ["channel_id", "playlist_id", "video_id"],
    },
    execute: async (client, args) => {
      return client.post(
        `/api/channels/${args.channel_id}/playlists/${args.playlist_id}/videos`,
        { video_id: args.video_id },
      );
    },
  },
];
