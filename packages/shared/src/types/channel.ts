export interface YtChannel {
  id: number;
  channel_id: string;
  channel_title: string;
  channel_thumbnail: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  daily_quota_limit: number;
  quota_alert_threshold: number;
  created_at: string;
  updated_at: string;
}
