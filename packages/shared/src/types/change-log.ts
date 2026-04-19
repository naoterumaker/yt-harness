export type ChangeType =
  | "thumbnail"
  | "title"
  | "description"
  | "tags"
  | "end_screen"
  | "card"
  | "chapter"
  | "pinned_comment"
  | "other";

export interface ChangeLog {
  id: number;
  channel_id: string;
  video_id: string;
  change_type: ChangeType;
  changed_at: string;
  effective_analytics_date: string | null;
  note: string | null;
  before_value: string | null;
  after_value: string | null;
  impact_score: number | null;
  created_by: string;
  created_at: string;
}
