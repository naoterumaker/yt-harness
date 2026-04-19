export interface TrafficSource {
  id: number;
  channel_id: string;
  video_id: string;
  analytics_date: string;
  traffic_type: string;
  views: number;
  estimated_minutes_watched: number;
  created_at: string;
  updated_at: string;
}
