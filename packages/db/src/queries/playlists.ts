import type { Playlist } from "@yt-harness/shared";

export async function getPlaylist(
  db: D1Database,
  id: number,
): Promise<Playlist | null> {
  return db
    .prepare("SELECT * FROM playlists WHERE id = ?")
    .bind(id)
    .first<Playlist>();
}

export async function listPlaylists(
  db: D1Database,
  channelId: string,
): Promise<Playlist[]> {
  const { results } = await db
    .prepare("SELECT * FROM playlists WHERE channel_id = ? ORDER BY created_at DESC")
    .bind(channelId)
    .all<Playlist>();
  return results;
}

export async function upsertPlaylist(
  db: D1Database,
  data: Omit<Playlist, "id" | "created_at" | "updated_at">,
): Promise<Playlist | null> {
  return db
    .prepare(
      `INSERT INTO playlists (channel_id, playlist_id, title, description, video_count)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (playlist_id) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         video_count = excluded.video_count,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.playlist_id,
      data.title,
      data.description,
      data.video_count,
    )
    .first<Playlist>();
}

export async function deletePlaylist(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM playlists WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
