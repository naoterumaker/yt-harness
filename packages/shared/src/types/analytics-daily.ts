export interface AnalyticsDaily {
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
  created_at: string;
  updated_at: string;
}
