import type { AnalyticsDaily } from "@yt-harness/shared";

export async function upsertDaily(
  db: D1Database,
  data: Omit<AnalyticsDaily, "id" | "created_at" | "updated_at">,
): Promise<AnalyticsDaily | null> {
  return db
    .prepare(
      `INSERT INTO analytics_daily (
        channel_id, video_id, analytics_date,
        video_thumbnail_impressions, video_thumbnail_impressions_ctr,
        views, estimated_minutes_watched, average_view_duration, average_view_percentage,
        subscribers_gained, subscribers_lost,
        likes, comments, shares, engaged_views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (channel_id, video_id, analytics_date) DO UPDATE SET
        video_thumbnail_impressions = excluded.video_thumbnail_impressions,
        video_thumbnail_impressions_ctr = excluded.video_thumbnail_impressions_ctr,
        views = excluded.views,
        estimated_minutes_watched = excluded.estimated_minutes_watched,
        average_view_duration = excluded.average_view_duration,
        average_view_percentage = excluded.average_view_percentage,
        subscribers_gained = excluded.subscribers_gained,
        subscribers_lost = excluded.subscribers_lost,
        likes = excluded.likes,
        comments = excluded.comments,
        shares = excluded.shares,
        engaged_views = excluded.engaged_views,
        updated_at = datetime('now')
      RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.video_id,
      data.analytics_date,
      data.video_thumbnail_impressions,
      data.video_thumbnail_impressions_ctr,
      data.views,
      data.estimated_minutes_watched,
      data.average_view_duration,
      data.average_view_percentage,
      data.subscribers_gained,
      data.subscribers_lost,
      data.likes,
      data.comments,
      data.shares,
      data.engaged_views,
    )
    .first<AnalyticsDaily>();
}

export async function getByChannelId(
  db: D1Database,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<AnalyticsDaily[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM analytics_daily
       WHERE channel_id = ? AND video_id = '__CHANNEL__'
         AND analytics_date >= ? AND analytics_date <= ?
       ORDER BY analytics_date ASC`,
    )
    .bind(channelId, startDate, endDate)
    .all<AnalyticsDaily>();
  return results;
}

export async function getByVideoId(
  db: D1Database,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<AnalyticsDaily[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM analytics_daily
       WHERE video_id = ?
         AND analytics_date >= ? AND analytics_date <= ?
       ORDER BY analytics_date ASC`,
    )
    .bind(videoId, startDate, endDate)
    .all<AnalyticsDaily>();
  return results;
}

export async function getTopVideos(
  db: D1Database,
  channelId: string,
  startDate: string,
  endDate: string,
  limit = 10,
): Promise<Array<{ video_id: string; total_views: number }>> {
  const { results } = await db
    .prepare(
      `SELECT video_id, SUM(views) as total_views
       FROM analytics_daily
       WHERE channel_id = ? AND video_id != '__CHANNEL__'
         AND analytics_date >= ? AND analytics_date <= ?
       GROUP BY video_id
       ORDER BY total_views DESC
       LIMIT ?`,
    )
    .bind(channelId, startDate, endDate, limit)
    .all<{ video_id: string; total_views: number }>();
  return results;
}
