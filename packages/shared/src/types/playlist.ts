export interface Playlist {
  id: number;
  channel_id: string;
  playlist_id: string;
  title: string;
  description: string | null;
  video_count: number;
  created_at: string;
  updated_at: string;
}
