import type { YouTubeHttpClient } from "../http/client.js";

export interface YouTubePlaylistListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
}

export interface YouTubePlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
  };
  contentDetails?: {
    itemCount: number;
  };
}

export interface YouTubePlaylistItemResponse {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    playlistId: string;
    position: number;
    resourceId: { kind: string; videoId: string };
  };
}

export interface PlaylistUpdateMetadata {
  snippet?: {
    title?: string;
    description?: string;
  };
  status?: {
    privacyStatus?: string;
  };
}

export class PlaylistsResource {
  constructor(private http: YouTubeHttpClient) {}

  /**
   * List playlists for a channel.
   */
  async list(channelId: string): Promise<YouTubePlaylistListResponse> {
    return this.http.fetch<YouTubePlaylistListResponse>("playlists", {
      params: {
        part: "snippet,contentDetails",
        channelId,
        maxResults: "50",
      },
    });
  }

  /**
   * Create a new playlist.
   */
  async create(
    title: string,
    description?: string,
  ): Promise<YouTubePlaylistItem> {
    return this.http.fetch<YouTubePlaylistItem>("playlists", {
      method: "POST",
      params: { part: "snippet,status" },
      body: {
        snippet: { title, description: description ?? "" },
        status: { privacyStatus: "private" },
      },
    });
  }

  /**
   * Update a playlist's metadata.
   */
  async update(
    playlistId: string,
    metadata: PlaylistUpdateMetadata,
  ): Promise<YouTubePlaylistItem> {
    return this.http.fetch<YouTubePlaylistItem>("playlists", {
      method: "PUT",
      params: { part: "snippet,status" },
      body: { id: playlistId, ...metadata },
    });
  }

  /**
   * Delete a playlist.
   */
  async delete(playlistId: string): Promise<void> {
    await this.http.fetch<void>("playlists", {
      method: "DELETE",
      params: { id: playlistId },
    });
  }

  /**
   * Add a video to a playlist.
   */
  async addVideo(
    playlistId: string,
    videoId: string,
  ): Promise<YouTubePlaylistItemResponse> {
    return this.http.fetch<YouTubePlaylistItemResponse>("playlistItems", {
      method: "POST",
      params: { part: "snippet" },
      body: {
        snippet: {
          playlistId,
          resourceId: { kind: "youtube#video", videoId },
        },
      },
    });
  }

  /**
   * Remove a video from a playlist by its playlistItem ID.
   */
  async removeVideo(playlistItemId: string): Promise<void> {
    await this.http.fetch<void>("playlistItems", {
      method: "DELETE",
      params: { id: playlistItemId },
    });
  }
}
