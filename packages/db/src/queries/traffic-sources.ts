import type { TrafficSource } from "@yt-harness/shared";

export async function upsert(
  db: D1Database,
  data: Omit<TrafficSource, "id" | "created_at" | "updated_at">,
): Promise<TrafficSource | null> {
  return db
    .prepare(
      `INSERT INTO traffic_sources (
        channel_id, video_id, analytics_date, traffic_type,
        views, estimated_minutes_watched
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (channel_id, video_id, analytics_date, traffic_type) DO UPDATE SET
        views = excluded.views,
        estimated_minutes_watched = excluded.estimated_minutes_watched,
        updated_at = datetime('now')
      RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.video_id,
      data.analytics_date,
      data.traffic_type,
      data.views,
      data.estimated_minutes_watched,
    )
    .first<TrafficSource>();
}

export async function getByChannelId(
  db: D1Database,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<TrafficSource[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM traffic_sources
       WHERE channel_id = ? AND video_id = '__CHANNEL__'
         AND analytics_date >= ? AND analytics_date <= ?
       ORDER BY analytics_date ASC, views DESC`,
    )
    .bind(channelId, startDate, endDate)
    .all<TrafficSource>();
  return results;
}

export async function getByVideoId(
  db: D1Database,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<TrafficSource[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM traffic_sources
       WHERE video_id = ?
         AND analytics_date >= ? AND analytics_date <= ?
       ORDER BY analytics_date ASC, views DESC`,
    )
    .bind(videoId, startDate, endDate)
    .all<TrafficSource>();
  return results;
}
