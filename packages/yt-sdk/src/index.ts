// Auth
export {
  YOUTUBE_READONLY,
  YOUTUBE_UPLOAD,
  YOUTUBE_FORCE_SSL,
  YOUTUBE_ANALYTICS_READONLY,
} from "./auth/scopes.js";
export { OAuth2Manager } from "./auth/oauth.js";
export type { TokenSet, OAuthConfig } from "./auth/oauth.js";

// Quota
export { QuotaTracker, QUOTA_COSTS, DAILY_LIMIT } from "./quota/tracker.js";

// HTTP
export {
  YouTubeHttpClient,
  YouTubeApiError,
  BASE_URL,
  ANALYTICS_URL,
} from "./http/client.js";
export type { YouTubeHttpOptions } from "./http/client.js";

// Resources
export { VideosResource } from "./resources/videos.js";
export type {
  YouTubeVideoListResponse,
  YouTubeVideoItem,
  VideoListParams,
  VideoUpdateMetadata,
} from "./resources/videos.js";

export { CommentsResource } from "./resources/comments.js";
export type {
  YouTubeCommentListResponse,
  YouTubeCommentThreadListResponse,
  YouTubeCommentItem,
  YouTubeCommentThreadItem,
  ModerationStatus,
} from "./resources/comments.js";

export { ChannelsResource } from "./resources/channels.js";
export type {
  YouTubeChannelListResponse,
  YouTubeChannelItem,
  YouTubeSubscriptionListResponse,
  YouTubeSubscriptionItem,
} from "./resources/channels.js";

export { PlaylistsResource } from "./resources/playlists.js";
export type {
  YouTubePlaylistListResponse,
  YouTubePlaylistItem,
  YouTubePlaylistItemResponse,
  PlaylistUpdateMetadata,
} from "./resources/playlists.js";

export { AnalyticsResource } from "./resources/analytics.js";
export type {
  AnalyticsQueryParams,
  YouTubeAnalyticsResponse,
} from "./resources/analytics.js";

// Client
export { YouTubeClient } from "./client.js";
export type { YouTubeClientConfig } from "./client.js";
