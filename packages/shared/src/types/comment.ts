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
