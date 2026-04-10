import type { YouTubeHttpClient } from "../http/client.js";

export interface YouTubeCommentListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeCommentItem[];
  nextPageToken?: string;
}

export interface YouTubeCommentThreadListResponse {
  kind: string;
  etag: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
  items: YouTubeCommentThreadItem[];
  nextPageToken?: string;
}

export interface YouTubeCommentItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    authorDisplayName: string;
    authorProfileImageUrl: string;
    authorChannelId: { value: string };
    textDisplay: string;
    textOriginal: string;
    likeCount: number;
    publishedAt: string;
    updatedAt: string;
    parentId?: string;
    videoId?: string;
  };
}

export interface YouTubeCommentThreadItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    videoId: string;
    topLevelComment: YouTubeCommentItem;
    totalReplyCount: number;
    isPublic: boolean;
  };
}

export type ModerationStatus =
  | "heldForReview"
  | "published"
  | "rejected";

export class CommentsResource {
  constructor(private http: YouTubeHttpClient) {}

  /**
   * List comment threads for a video.
   */
  async listByVideo(
    videoId: string,
    maxResults = 20,
  ): Promise<YouTubeCommentThreadListResponse> {
    return this.http.fetch<YouTubeCommentThreadListResponse>(
      "commentThreads",
      {
        params: {
          part: "snippet",
          videoId,
          maxResults: String(maxResults),
          order: "time",
        },
      },
    );
  }

  /**
   * Post a top-level comment on a video.
   */
  async insert(
    videoId: string,
    text: string,
  ): Promise<YouTubeCommentThreadItem> {
    return this.http.fetch<YouTubeCommentThreadItem>("commentThreads", {
      method: "POST",
      params: { part: "snippet" },
      body: {
        snippet: {
          videoId,
          topLevelComment: { snippet: { textOriginal: text } },
        },
      },
    });
  }

  /**
   * Reply to an existing comment.
   */
  async reply(
    parentId: string,
    text: string,
  ): Promise<YouTubeCommentItem> {
    return this.http.fetch<YouTubeCommentItem>("comments", {
      method: "POST",
      params: { part: "snippet" },
      body: {
        snippet: { parentId, textOriginal: text },
      },
    });
  }

  /**
   * Update a comment's text.
   */
  async update(
    commentId: string,
    text: string,
  ): Promise<YouTubeCommentItem> {
    return this.http.fetch<YouTubeCommentItem>("comments", {
      method: "PUT",
      params: { part: "snippet" },
      body: {
        id: commentId,
        snippet: { textOriginal: text },
      },
    });
  }

  /**
   * Delete a comment.
   */
  async delete(commentId: string): Promise<void> {
    await this.http.fetch<void>("comments", {
      method: "DELETE",
      params: { id: commentId },
    });
  }

  /**
   * Set the moderation status of a comment.
   */
  async setModerationStatus(
    commentId: string,
    status: ModerationStatus,
  ): Promise<void> {
    await this.http.fetch<void>("comments/setModerationStatus", {
      method: "POST",
      params: {
        id: commentId,
        moderationStatus: status,
      },
    });
  }
}
