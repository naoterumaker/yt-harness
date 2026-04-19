import type { VideoMetricsSnapshot } from "@yt-harness/shared";

export async function upsertSnapshot(
  db: D1Database,
  data: Omit<VideoMetricsSnapshot, "id" | "created_at" | "updated_at">,
): Promise<VideoMetricsSnapshot | null> {
  return db
    .prepare(
      `INSERT INTO video_metrics_snapshots (video_id, channel_id, snapshot_date, view_count, like_count, comment_count)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (video_id, snapshot_date) DO UPDATE SET
         channel_id = excluded.channel_id,
         view_count = excluded.view_count,
         like_count = excluded.like_count,
         comment_count = excluded.comment_count,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(
      data.video_id,
      data.channel_id,
      data.snapshot_date,
      data.view_count,
      data.like_count,
      data.comment_count,
    )
    .first<VideoMetricsSnapshot>();
}

export async function getByVideoId(
  db: D1Database,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<VideoMetricsSnapshot[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM video_metrics_snapshots
       WHERE video_id = ? AND snapshot_date >= ? AND snapshot_date <= ?
       ORDER BY snapshot_date ASC`,
    )
    .bind(videoId, startDate, endDate)
    .all<VideoMetricsSnapshot>();
  return results;
}

export async function getByChannelId(
  db: D1Database,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<VideoMetricsSnapshot[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM video_metrics_snapshots
       WHERE channel_id = ? AND snapshot_date >= ? AND snapshot_date <= ?
       ORDER BY snapshot_date ASC`,
    )
    .bind(channelId, startDate, endDate)
    .all<VideoMetricsSnapshot>();
  return results;
}
