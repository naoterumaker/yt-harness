import type { Subscriber, SubscriberSnapshot } from "@yt-harness/shared";

export async function getSubscriber(
  db: D1Database,
  id: number,
): Promise<Subscriber | null> {
  return db
    .prepare("SELECT * FROM subscribers WHERE id = ?")
    .bind(id)
    .first<Subscriber>();
}

export async function listSubscribers(
  db: D1Database,
  channelId: string,
): Promise<Subscriber[]> {
  const { results } = await db
    .prepare("SELECT * FROM subscribers WHERE channel_id = ? ORDER BY created_at DESC")
    .bind(channelId)
    .all<Subscriber>();
  return results;
}

export async function upsertSubscriber(
  db: D1Database,
  data: Omit<Subscriber, "id" | "created_at" | "updated_at">,
): Promise<Subscriber | null> {
  return db
    .prepare(
      `INSERT INTO subscribers (channel_id, youtube_channel_id, display_name, profile_image_url, subscribed_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (channel_id, youtube_channel_id) DO UPDATE SET
         display_name = excluded.display_name,
         profile_image_url = excluded.profile_image_url,
         subscribed_at = excluded.subscribed_at,
         is_active = excluded.is_active,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.youtube_channel_id,
      data.display_name,
      data.profile_image_url,
      data.subscribed_at,
      data.is_active ? 1 : 0,
    )
    .first<Subscriber>();
}

export async function markUnsubscribed(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare(
      "UPDATE subscribers SET is_active = 0, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

export async function createSnapshot(
  db: D1Database,
  data: Omit<SubscriberSnapshot, "id">,
): Promise<SubscriberSnapshot | null> {
  return db
    .prepare(
      `INSERT INTO subscriber_snapshots (subscriber_id, subscriber_count, snapshot_at)
       VALUES (?, ?, ?)
       RETURNING *`,
    )
    .bind(data.subscriber_id, data.subscriber_count, data.snapshot_at)
    .first<SubscriberSnapshot>();
}

export async function listSnapshots(
  db: D1Database,
  channelId: string,
): Promise<SubscriberSnapshot[]> {
  const { results } = await db
    .prepare(
      `SELECT ss.* FROM subscriber_snapshots ss
       JOIN subscribers s ON ss.subscriber_id = s.id
       WHERE s.channel_id = ?
       ORDER BY ss.snapshot_at DESC`,
    )
    .bind(channelId)
    .all<SubscriberSnapshot>();
  return results;
}
