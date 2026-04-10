export interface Tag {
  id: number;
  channel_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface SubscriberTag {
  id: number;
  subscriber_id: number;
  tag_id: number;
  created_at: string;
}
