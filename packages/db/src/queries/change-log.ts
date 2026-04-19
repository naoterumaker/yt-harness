import type { ChangeLog } from "@yt-harness/shared";

export async function insertChangeLog(
  db: D1Database,
  data: Omit<ChangeLog, "id" | "created_at">,
): Promise<ChangeLog | null> {
  return db
    .prepare(
      `INSERT INTO change_log (
        channel_id, video_id, change_type, changed_at,
        effective_analytics_date, note, before_value, after_value,
        impact_score, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.video_id,
      data.change_type,
      data.changed_at,
      data.effective_analytics_date,
      data.note,
      data.before_value,
      data.after_value,
      data.impact_score,
      data.created_by,
    )
    .first<ChangeLog>();
}

export async function getByChannelId(
  db: D1Database,
  channelId: string,
  startDate?: string,
  endDate?: string,
): Promise<ChangeLog[]> {
  let sql = `SELECT * FROM change_log WHERE channel_id = ?`;
  const binds: unknown[] = [channelId];

  if (startDate) {
    sql += ` AND changed_at >= ?`;
    binds.push(startDate);
  }
  if (endDate) {
    sql += ` AND changed_at <= ?`;
    binds.push(endDate);
  }

  sql += ` ORDER BY changed_at DESC`;

  const { results } = await db
    .prepare(sql)
    .bind(...binds)
    .all<ChangeLog>();
  return results;
}

export async function getByVideoId(
  db: D1Database,
  videoId: string,
  startDate?: string,
  endDate?: string,
): Promise<ChangeLog[]> {
  let sql = `SELECT * FROM change_log WHERE video_id = ?`;
  const binds: unknown[] = [videoId];

  if (startDate) {
    sql += ` AND changed_at >= ?`;
    binds.push(startDate);
  }
  if (endDate) {
    sql += ` AND changed_at <= ?`;
    binds.push(endDate);
  }

  sql += ` ORDER BY changed_at DESC`;

  const { results } = await db
    .prepare(sql)
    .bind(...binds)
    .all<ChangeLog>();
  return results;
}

export async function getByDateRange(
  db: D1Database,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<ChangeLog[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM change_log
       WHERE channel_id = ?
         AND changed_at >= ? AND changed_at <= ?
       ORDER BY changed_at ASC`,
    )
    .bind(channelId, startDate, endDate)
    .all<ChangeLog>();
  return results;
}

export async function updateImpactScore(
  db: D1Database,
  id: number,
  score: number,
): Promise<ChangeLog | null> {
  return db
    .prepare(
      `UPDATE change_log SET impact_score = ? WHERE id = ? RETURNING *`,
    )
    .bind(score, id)
    .first<ChangeLog>();
}
