export interface ViewerDemographicsPct {
  id: number;
  channel_id: string;
  video_id: string;
  analytics_date: string;
  dimension_type: string;
  dimension_value: string;
  viewer_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface ViewerDemographicsCounts {
  id: number;
  channel_id: string;
  video_id: string;
  analytics_date: string;
  dimension_type: string;
  dimension_value: string;
  views: number | null;
  estimated_minutes_watched: number | null;
  created_at: string;
  updated_at: string;
}
