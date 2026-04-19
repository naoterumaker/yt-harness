import type { ViewerDemographicsPct, ViewerDemographicsCounts } from "@yt-harness/shared";

export async function upsertPct(
  db: D1Database,
  data: Omit<ViewerDemographicsPct, "id" | "created_at" | "updated_at">,
): Promise<ViewerDemographicsPct | null> {
  return db
    .prepare(
      `INSERT INTO viewer_demographics_pct (
        channel_id, video_id, analytics_date,
        dimension_type, dimension_value, viewer_percentage
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (channel_id, video_id, analytics_date, dimension_type, dimension_value) DO UPDATE SET
        viewer_percentage = excluded.viewer_percentage,
        updated_at = datetime('now')
      RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.video_id,
      data.analytics_date,
      data.dimension_type,
      data.dimension_value,
      data.viewer_percentage,
    )
    .first<ViewerDemographicsPct>();
}

export async function upsertCounts(
  db: D1Database,
  data: Omit<ViewerDemographicsCounts, "id" | "created_at" | "updated_at">,
): Promise<ViewerDemographicsCounts | null> {
  return db
    .prepare(
      `INSERT INTO viewer_demographics_counts (
        channel_id, video_id, analytics_date,
        dimension_type, dimension_value, views, estimated_minutes_watched
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (channel_id, video_id, analytics_date, dimension_type, dimension_value) DO UPDATE SET
        views = excluded.views,
        estimated_minutes_watched = excluded.estimated_minutes_watched,
        updated_at = datetime('now')
      RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.video_id,
      data.analytics_date,
      data.dimension_type,
      data.dimension_value,
      data.views,
      data.estimated_minutes_watched,
    )
    .first<ViewerDemographicsCounts>();
}

export async function getPctByChannelId(
  db: D1Database,
  channelId: string,
  startDate: string,
  endDate: string,
  dimensionType?: string,
): Promise<ViewerDemographicsPct[]> {
  if (dimensionType) {
    const { results } = await db
      .prepare(
        `SELECT * FROM viewer_demographics_pct
         WHERE channel_id = ? AND video_id = '__CHANNEL__'
           AND analytics_date >= ? AND analytics_date <= ?
           AND dimension_type = ?
         ORDER BY analytics_date ASC, viewer_percentage DESC`,
      )
      .bind(channelId, startDate, endDate, dimensionType)
      .all<ViewerDemographicsPct>();
    return results;
  }

  const { results } = await db
    .prepare(
      `SELECT * FROM viewer_demographics_pct
       WHERE channel_id = ? AND video_id = '__CHANNEL__'
         AND analytics_date >= ? AND analytics_date <= ?
       ORDER BY analytics_date ASC, dimension_type, viewer_percentage DESC`,
    )
    .bind(channelId, startDate, endDate)
    .all<ViewerDemographicsPct>();
  return results;
}

export async function getCountsByChannelId(
  db: D1Database,
  channelId: string,
  startDate: string,
  endDate: string,
  dimensionType?: string,
): Promise<ViewerDemographicsCounts[]> {
  if (dimensionType) {
    const { results } = await db
      .prepare(
        `SELECT * FROM viewer_demographics_counts
         WHERE channel_id = ? AND video_id = '__CHANNEL__'
           AND analytics_date >= ? AND analytics_date <= ?
           AND dimension_type = ?
         ORDER BY analytics_date ASC, views DESC`,
      )
      .bind(channelId, startDate, endDate, dimensionType)
      .all<ViewerDemographicsCounts>();
    return results;
  }

  const { results } = await db
    .prepare(
      `SELECT * FROM viewer_demographics_counts
       WHERE channel_id = ? AND video_id = '__CHANNEL__'
         AND analytics_date >= ? AND analytics_date <= ?
       ORDER BY analytics_date ASC, dimension_type, views DESC`,
    )
    .bind(channelId, startDate, endDate)
    .all<ViewerDemographicsCounts>();
  return results;
}
