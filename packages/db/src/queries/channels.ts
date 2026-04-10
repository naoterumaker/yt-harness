import type { YtChannel } from "@yt-harness/shared";

export async function getChannel(
  db: D1Database,
  id: number,
): Promise<YtChannel | null> {
  return db
    .prepare("SELECT * FROM channels WHERE id = ?")
    .bind(id)
    .first<YtChannel>();
}

export async function listChannels(db: D1Database): Promise<YtChannel[]> {
  const { results } = await db
    .prepare("SELECT * FROM channels ORDER BY created_at DESC")
    .all<YtChannel>();
  return results;
}

export async function upsertChannel(
  db: D1Database,
  data: Omit<YtChannel, "id" | "created_at" | "updated_at">,
): Promise<YtChannel | null> {
  return db
    .prepare(
      `INSERT INTO channels (channel_id, channel_title, channel_thumbnail, access_token, refresh_token, token_expires_at, daily_quota_limit, quota_alert_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (channel_id) DO UPDATE SET
         channel_title = excluded.channel_title,
         channel_thumbnail = excluded.channel_thumbnail,
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         token_expires_at = excluded.token_expires_at,
         daily_quota_limit = excluded.daily_quota_limit,
         quota_alert_threshold = excluded.quota_alert_threshold,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.channel_title,
      data.channel_thumbnail,
      data.access_token,
      data.refresh_token,
      data.token_expires_at,
      data.daily_quota_limit,
      data.quota_alert_threshold,
    )
    .first<YtChannel>();
}

export async function updateTokens(
  db: D1Database,
  id: number,
  tokens: { access_token: string; refresh_token: string; token_expires_at: string },
): Promise<YtChannel | null> {
  return db
    .prepare(
      `UPDATE channels SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = datetime('now')
       WHERE id = ? RETURNING *`,
    )
    .bind(tokens.access_token, tokens.refresh_token, tokens.token_expires_at, id)
    .first<YtChannel>();
}

export async function deleteChannel(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM channels WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
