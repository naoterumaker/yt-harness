import type { QuotaUsage } from "@yt-harness/shared";

export async function getQuotaForDate(
  db: D1Database,
  channelId: string,
  date: string,
): Promise<QuotaUsage[]> {
  const { results } = await db
    .prepare(
      "SELECT * FROM quota_usage WHERE channel_id = ? AND date(used_at) = date(?) ORDER BY used_at DESC",
    )
    .bind(channelId, date)
    .all<QuotaUsage>();
  return results;
}

export async function addQuotaUsage(
  db: D1Database,
  channelId: string,
  operation: string,
  units: number,
): Promise<QuotaUsage | null> {
  return db
    .prepare(
      `INSERT INTO quota_usage (channel_id, endpoint, units_used, used_at)
       VALUES (?, ?, ?, datetime('now'))
       RETURNING *`,
    )
    .bind(channelId, operation, units)
    .first<QuotaUsage>();
}

export async function getDailyTotal(
  db: D1Database,
  channelId: string,
): Promise<number> {
  const row = await db
    .prepare(
      "SELECT COALESCE(SUM(units_used), 0) AS total FROM quota_usage WHERE channel_id = ? AND date(used_at) = date('now')",
    )
    .bind(channelId)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function getWeeklyHistory(
  db: D1Database,
  channelId: string,
): Promise<{ date: string; total: number }[]> {
  const { results } = await db
    .prepare(
      `SELECT date(used_at) AS date, SUM(units_used) AS total
       FROM quota_usage
       WHERE channel_id = ? AND used_at >= datetime('now', '-7 days')
       GROUP BY date(used_at)
       ORDER BY date DESC`,
    )
    .bind(channelId)
    .all<{ date: string; total: number }>();
  return results;
}
