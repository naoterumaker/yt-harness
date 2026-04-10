import type { Tag, SubscriberTag } from "@yt-harness/shared";

export async function listTags(
  db: D1Database,
  channelId: string,
): Promise<Tag[]> {
  const { results } = await db
    .prepare("SELECT * FROM tags WHERE channel_id = ? ORDER BY name ASC")
    .bind(channelId)
    .all<Tag>();
  return results;
}

export async function createTag(
  db: D1Database,
  data: Omit<Tag, "id" | "created_at">,
): Promise<Tag | null> {
  return db
    .prepare(
      `INSERT INTO tags (channel_id, name, color)
       VALUES (?, ?, ?)
       RETURNING *`,
    )
    .bind(data.channel_id, data.name, data.color)
    .first<Tag>();
}

export async function deleteTag(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM tags WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

export async function tagSubscriber(
  db: D1Database,
  subscriberId: number,
  tagId: number,
): Promise<SubscriberTag | null> {
  return db
    .prepare(
      `INSERT INTO subscriber_tags (subscriber_id, tag_id)
       VALUES (?, ?)
       ON CONFLICT (subscriber_id, tag_id) DO NOTHING
       RETURNING *`,
    )
    .bind(subscriberId, tagId)
    .first<SubscriberTag>();
}

export async function untagSubscriber(
  db: D1Database,
  subscriberId: number,
  tagId: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM subscriber_tags WHERE subscriber_id = ? AND tag_id = ?")
    .bind(subscriberId, tagId)
    .run();
  return result.meta.changes > 0;
}

export async function getSubscriberTags(
  db: D1Database,
  subscriberId: number,
): Promise<Tag[]> {
  const { results } = await db
    .prepare(
      `SELECT t.* FROM tags t
       JOIN subscriber_tags st ON t.id = st.tag_id
       WHERE st.subscriber_id = ?
       ORDER BY t.name ASC`,
    )
    .bind(subscriberId)
    .all<Tag>();
  return results;
}
