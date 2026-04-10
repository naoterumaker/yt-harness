import type { YouTubeHttpClient } from "../http/client.js";

export interface YouTubeVideoListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeVideoItem[];
  nextPageToken?: string;
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet?: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
    channelTitle: string;
    tags?: string[];
    categoryId: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
    favoriteCount: string;
  };
  status?: {
    uploadStatus: string;
    privacyStatus: string;
    publishAt?: string;
  };
}

export interface VideoListParams {
  part?: string;
  chart?: string;
  id?: string;
  myRating?: string;
  maxResults?: number;
  pageToken?: string;
}

export interface VideoUpdateMetadata {
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
  };
  status?: {
    privacyStatus?: string;
    publishAt?: string;
  };
}

export class VideosResource {
  constructor(private http: YouTubeHttpClient) {}

  /**
   * List videos by various filters.
   */
  async list(
    params: VideoListParams = {},
  ): Promise<YouTubeVideoListResponse> {
    const queryParams: Record<string, string> = {
      part: params.part ?? "snippet,statistics,status",
    };
    if (params.chart) queryParams["chart"] = params.chart;
    if (params.id) queryParams["id"] = params.id;
    if (params.myRating) queryParams["myRating"] = params.myRating;
    if (params.maxResults)
      queryParams["maxResults"] = String(params.maxResults);
    if (params.pageToken) queryParams["pageToken"] = params.pageToken;

    return this.http.fetch<YouTubeVideoListResponse>("videos", {
      params: queryParams,
    });
  }

  /**
   * Get a single video by ID.
   */
  async get(videoId: string): Promise<YouTubeVideoItem | null> {
    const res = await this.list({
      id: videoId,
      part: "snippet,statistics,status",
    });
    return res.items[0] ?? null;
  }

  /**
   * Update video metadata.
   */
  async update(
    videoId: string,
    metadata: VideoUpdateMetadata,
  ): Promise<YouTubeVideoItem> {
    return this.http.fetch<YouTubeVideoItem>("videos", {
      method: "PUT",
      params: { part: "snippet,status" },
      body: { id: videoId, ...metadata },
    });
  }

  /**
   * Delete a video.
   */
  async delete(videoId: string): Promise<void> {
    await this.http.fetch<void>("videos", {
      method: "DELETE",
      params: { id: videoId },
    });
  }

  /**
   * Rate a video (like, dislike, or none).
   */
  async rate(
    videoId: string,
    rating: "like" | "dislike" | "none",
  ): Promise<void> {
    await this.http.fetch<void>("videos/rate", {
      method: "POST",
      params: { id: videoId, rating },
    });
  }

  /**
   * Get video statistics (convenience wrapper).
   */
  async getMetrics(
    videoId: string,
  ): Promise<YouTubeVideoItem["statistics"] | null> {
    const res = await this.list({ id: videoId, part: "statistics" });
    return res.items[0]?.statistics ?? null;
  }
}
