import type { YouTubeHttpClient } from "../http/client.js";

export interface YouTubeChannelListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeChannelItem[];
}

export interface YouTubeChannelItem {
  kind: string;
  etag: string;
  id: string;
  snippet?: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
    country?: string;
  };
  statistics?: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  contentDetails?: {
    relatedPlaylists: {
      likes: string;
      uploads: string;
    };
  };
}

export interface YouTubeSubscriptionListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeSubscriptionItem[];
  nextPageToken?: string;
}

export interface YouTubeSubscriptionItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    title: string;
    description: string;
    channelId: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
  };
  subscriberSnippet?: {
    title: string;
    description: string;
    channelId: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
  };
}

export class ChannelsResource {
  constructor(private http: YouTubeHttpClient) {}

  /**
   * Get the authenticated user's channel.
   */
  async getMine(): Promise<YouTubeChannelItem | null> {
    const res = await this.http.fetch<YouTubeChannelListResponse>(
      "channels",
      {
        params: {
          part: "snippet,statistics,contentDetails",
          mine: "true",
        },
      },
    );
    return res.items[0] ?? null;
  }

  /**
   * Get a channel by its ID.
   */
  async getById(channelId: string): Promise<YouTubeChannelItem | null> {
    const res = await this.http.fetch<YouTubeChannelListResponse>(
      "channels",
      {
        params: {
          part: "snippet,statistics,contentDetails",
          id: channelId,
        },
      },
    );
    return res.items[0] ?? null;
  }

  /**
   * List subscribers (requires the channel's own subscriptions scope).
   */
  async listSubscribers(
    maxResults = 20,
  ): Promise<YouTubeSubscriptionListResponse> {
    return this.http.fetch<YouTubeSubscriptionListResponse>(
      "subscriptions",
      {
        params: {
          part: "snippet,subscriberSnippet",
          myRecentSubscribers: "true",
          maxResults: String(maxResults),
        },
      },
    );
  }
}
