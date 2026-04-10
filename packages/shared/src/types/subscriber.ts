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

export interface SubscriberSnapshot {
  id: number;
  subscriber_id: number;
  subscriber_count: number;
  snapshot_at: string;
}
