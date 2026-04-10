export type VideoStatus = "public" | "private" | "unlisted" | "scheduled";

export interface Video {
  id: number;
  channel_id: string;
  video_id: string;
  title: string;
  description: string | null;
  status: VideoStatus;
  published_at: string | null;
  scheduled_at: string | null;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}
