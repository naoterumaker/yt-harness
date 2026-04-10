import type { Video } from "@yt-harness/shared";

export async function getVideo(
  db: D1Database,
  id: number,
): Promise<Video | null> {
  return db
    .prepare("SELECT * FROM videos WHERE id = ?")
    .bind(id)
    .first<Video>();
}

export async function getVideoByVideoId(
  db: D1Database,
  videoId: string,
): Promise<Video | null> {
  return db
    .prepare("SELECT * FROM videos WHERE video_id = ?")
    .bind(videoId)
    .first<Video>();
}

export async function listVideos(
  db: D1Database,
  channelId: string,
): Promise<Video[]> {
  const { results } = await db
    .prepare("SELECT * FROM videos WHERE channel_id = ? ORDER BY published_at DESC")
    .bind(channelId)
    .all<Video>();
  return results;
}

export async function upsertVideo(
  db: D1Database,
  data: Omit<Video, "id" | "created_at" | "updated_at">,
): Promise<Video | null> {
  return db
    .prepare(
      `INSERT INTO videos (channel_id, video_id, title, description, status, published_at, scheduled_at, thumbnail_url, view_count, like_count, comment_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (video_id) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         status = excluded.status,
         published_at = excluded.published_at,
         scheduled_at = excluded.scheduled_at,
         thumbnail_url = excluded.thumbnail_url,
         view_count = excluded.view_count,
         like_count = excluded.like_count,
         comment_count = excluded.comment_count,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.video_id,
      data.title,
      data.description,
      data.status,
      data.published_at,
      data.scheduled_at,
      data.thumbnail_url,
      data.view_count,
      data.like_count,
      data.comment_count,
    )
    .first<Video>();
}

export async function updateVideoMetrics(
  db: D1Database,
  id: number,
  metrics: { view_count: number; like_count: number; comment_count: number },
): Promise<Video | null> {
  return db
    .prepare(
      `UPDATE videos SET view_count = ?, like_count = ?, comment_count = ?, updated_at = datetime('now')
       WHERE id = ? RETURNING *`,
    )
    .bind(metrics.view_count, metrics.like_count, metrics.comment_count, id)
    .first<Video>();
}

export async function deleteVideo(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM videos WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
