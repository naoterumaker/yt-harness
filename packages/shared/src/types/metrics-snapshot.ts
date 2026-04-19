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
