const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { params, ...init } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ---------- typed helpers ----------

export interface Channel {
  id: number;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
  daily_quota_limit: number;
  quota_alert_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  channel_id: string;
  video_id: string;
  title: string;
  description: string | null;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  video_id: string;
  comment_id: string;
  parent_comment_id: string | null;
  author_channel_id: string;
  author_display_name: string;
  text: string;
  like_count: number;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface CommentGate {
  id: number;
  channel_id: string;
  video_id: string;
  name: string;
  trigger: string;
  trigger_keyword: string | null;
  action: string;
  reply_template: string | null;
  lottery_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscriber {
  id: number;
  channel_id: string;
  youtube_channel_id: string;
  display_name: string;
  profile_image_url: string | null;
  subscribed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageData {
  channel_id: string;
  daily_limit: number;
  daily_used: number;
  daily_remaining: number;
  alert_threshold: number;
}

export async function fetchChannels() {
  return apiFetch<{ channels: Channel[] }>('/api/channels');
}

export async function fetchVideos(channelId: number) {
  return apiFetch<{ videos: Video[] }>(`/api/channels/${channelId}/videos`);
}

export async function fetchComments(channelId: number, options?: { offset?: number; limit?: number }) {
  const params: Record<string, string> = {};
  if (options?.offset !== undefined) params.offset = String(options.offset);
  if (options?.limit !== undefined) params.limit = String(options.limit);
  return apiFetch<{ comments: Comment[]; total: number }>(`/api/channels/${channelId}/comments`, { params });
}

export async function fetchVideo(channelId: number, videoId: number) {
  return apiFetch<{ video: Video }>(`/api/channels/${channelId}/videos/${videoId}`);
}

export async function moderateComment(channelId: number, commentId: number, status: 'approved' | 'held' | 'rejected') {
  return apiFetch<{ moderated: boolean }>(`/api/channels/${channelId}/comments/${commentId}/moderate`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export async function replyComment(channelId: number, payload: { video_id: string; comment_id: string; parent_comment_id: string; author_channel_id: string; author_display_name: string; text: string; like_count: number; is_pinned: boolean; published_at: string }) {
  return apiFetch<{ comment: Comment }>(`/api/channels/${channelId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchGates(channelId: number) {
  return apiFetch<{ gates: CommentGate[] }>(`/api/channels/${channelId}/gates`);
}

export async function fetchSubscribers(channelId: number) {
  return apiFetch<{ subscribers: Subscriber[] }>(`/api/channels/${channelId}/subscribers`);
}

export async function fetchUsage(channelId: number) {
  return apiFetch<UsageData>(`/api/channels/${channelId}/usage`);
}

export async function fetchAnalytics(channelId: number, startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  return apiFetch<{ analytics: unknown }>(`/api/channels/${channelId}/analytics/channel`, { params });
}

// ---------- analytics summary ----------

export interface AnalyticsSummary {
  impressions: number;
  ctr: number;
  avg_view_duration: number;
  watch_time_hours: number;
  previous_impressions?: number;
  previous_ctr?: number;
  previous_avg_view_duration?: number;
}

export async function fetchAnalyticsSummary(channelId: number, days: number) {
  return apiFetch<AnalyticsSummary>(`/api/channels/${channelId}/analytics/summary`, {
    params: { days: days.toString() },
  });
}

// ---------- gate creation ----------

export interface CreateGatePayload {
  name: string;
  video_id?: string;
  trigger: string;
  trigger_keyword?: string;
  action: string;
  reply_template?: string;
  lottery_rate?: number;
  hot_window_minutes?: number;
  polling_interval_minutes?: number;
}

export async function createGate(channelId: number, payload: CreateGatePayload) {
  return apiFetch<{ gate: CommentGate }>(`/api/channels/${channelId}/gates`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------- subscriber snapshots ----------

export interface SubscriberSnapshot {
  id: number;
  channel_id: string;
  subscriber_count: number;
  snapshot_date: string;
  created_at: string;
}

export async function fetchSubscriberSnapshots(channelId: number) {
  return apiFetch<{ snapshots: SubscriberSnapshot[] }>(`/api/channels/${channelId}/subscribers/snapshots`);
}

export async function syncSubscribers(channelId: number) {
  return apiFetch<{ ok: boolean }>(`/api/channels/${channelId}/subscribers/sync`, { method: 'POST' });
}

// ---------- sequences ----------

export interface Sequence {
  id: number;
  channel_id: string;
  name: string;
  trigger: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchSequences(channelId: number) {
  return apiFetch<{ sequences: Sequence[] }>(`/api/channels/${channelId}/sequences`);
}

// ---------- playlists ----------

export interface Playlist {
  id: number;
  channel_id: string;
  playlist_id: string;
  title: string;
  description: string | null;
  privacy_status: string;
  video_count: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPlaylists(channelId: number) {
  return apiFetch<{ playlists: Playlist[] }>(`/api/channels/${channelId}/playlists`);
}

export async function syncPlaylists(channelId: number) {
  return apiFetch<{ ok: boolean }>(`/api/channels/${channelId}/playlists/sync`, { method: 'POST' });
}

// ---------- analytics daily (from DB) ----------

export interface AnalyticsDailyRow {
  id: number;
  channel_id: string;
  video_id: string;
  analytics_date: string;
  video_thumbnail_impressions: number | null;
  video_thumbnail_impressions_ctr: number | null;
  views: number | null;
  estimated_minutes_watched: number | null;
  average_view_duration: number | null;
  average_view_percentage: number | null;
  subscribers_gained: number | null;
  subscribers_lost: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  engaged_views: number | null;
}

export async function fetchAnalyticsDaily(channelId: number, startDate: string, endDate: string) {
  return apiFetch<{ channel_id: string; start_date: string; end_date: string; count: number; data: AnalyticsDailyRow[] }>(
    `/api/channels/${channelId}/analytics/daily`,
    { params: { start_date: startDate, end_date: endDate } },
  );
}

// ---------- traffic sources (from DB) ----------

export interface TrafficSourceRow {
  id: number;
  channel_id: string;
  video_id: string;
  analytics_date: string;
  traffic_type: string;
  views: number;
  estimated_minutes_watched: number;
}

export async function fetchTrafficSources(channelId: number, startDate: string, endDate: string) {
  return apiFetch<{ channel_id: string; start_date: string; end_date: string; count: number; data: TrafficSourceRow[] }>(
    `/api/channels/${channelId}/analytics/traffic`,
    { params: { start_date: startDate, end_date: endDate } },
  );
}

// ---------- demographics (from DB) ----------

export interface DemographicsPctRow {
  id: number;
  channel_id: string;
  video_id: string;
  analytics_date: string;
  dimension_type: string;
  dimension_value: string;
  viewer_percentage: number | null;
}

export interface DemographicsCountsRow {
  id: number;
  channel_id: string;
  video_id: string;
  analytics_date: string;
  dimension_type: string;
  dimension_value: string;
  views: number | null;
  estimated_minutes_watched: number | null;
}

export async function fetchDemographicsPct(
  channelId: number,
  type: 'ageGroup' | 'gender',
  startDate: string,
  endDate: string,
) {
  return apiFetch<{ channel_id: string; dimension_type: string; start_date: string; end_date: string; count: number; data: DemographicsPctRow[] }>(
    `/api/channels/${channelId}/analytics/demographics`,
    { params: { type, start_date: startDate, end_date: endDate } },
  );
}

export async function fetchDemographicsCounts(
  channelId: number,
  type: 'country' | 'deviceType',
  startDate: string,
  endDate: string,
) {
  return apiFetch<{ channel_id: string; dimension_type: string; start_date: string; end_date: string; count: number; data: DemographicsCountsRow[] }>(
    `/api/channels/${channelId}/analytics/demographics`,
    { params: { type, start_date: startDate, end_date: endDate } },
  );
}

// ---------- analytics sync-all ----------

export async function syncAllAnalytics(channelId: number) {
  return apiFetch<{ ok: boolean; channel_id: string; daily_upserted: number; traffic_upserted: number; demographics_pct_upserted: number; demographics_counts_upserted: number }>(
    `/api/channels/${channelId}/analytics/sync-all`,
    { method: 'POST' },
  );
}

// ---------- video metrics snapshots ----------

export interface VideoMetricsSnapshot {
  id: number;
  video_id: string;
  channel_id: string;
  snapshot_date: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export async function fetchVideoSnapshots(channelId: number, videoId: string, startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  return apiFetch<{ snapshots: VideoMetricsSnapshot[]; video_id: string; start_date: string; end_date: string }>(
    `/api/channels/${channelId}/analytics/videos/${videoId}/snapshots`,
    { params },
  );
}
