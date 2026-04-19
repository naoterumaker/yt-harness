import type { Comment } from "@yt-harness/shared";

export async function getComment(
  db: D1Database,
  id: number,
): Promise<Comment | null> {
  return db
    .prepare("SELECT * FROM comments WHERE id = ?")
    .bind(id)
    .first<Comment>();
}

export async function listComments(
  db: D1Database,
  videoId: string,
): Promise<Comment[]> {
  const { results } = await db
    .prepare("SELECT * FROM comments WHERE video_id = ? ORDER BY published_at DESC")
    .bind(videoId)
    .all<Comment>();
  return results;
}

export async function countCommentsByChannel(
  db: D1Database,
  channelId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as cnt FROM comments c
       JOIN videos v ON c.video_id = v.video_id
       WHERE v.channel_id = ?`,
    )
    .bind(channelId)
    .first<{ cnt: number }>();
  return row?.cnt ?? 0;
}

export async function listCommentsByChannel(
  db: D1Database,
  channelId: string,
  options?: { offset?: number; limit?: number },
): Promise<Comment[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  const { results } = await db
    .prepare(
      `SELECT c.* FROM comments c
       JOIN videos v ON c.video_id = v.video_id
       WHERE v.channel_id = ?
       ORDER BY c.published_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(channelId, limit, offset)
    .all<Comment>();
  return results;
}

export async function upsertComment(
  db: D1Database,
  data: Omit<Comment, "id" | "created_at" | "updated_at">,
): Promise<Comment | null> {
  return db
    .prepare(
      `INSERT INTO comments (video_id, comment_id, parent_comment_id, author_channel_id, author_display_name, text, like_count, is_pinned, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (comment_id) DO UPDATE SET
         text = excluded.text,
         like_count = excluded.like_count,
         is_pinned = excluded.is_pinned,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(
      data.video_id,
      data.comment_id,
      data.parent_comment_id,
      data.author_channel_id,
      data.author_display_name,
      data.text,
      data.like_count,
      data.is_pinned ? 1 : 0,
      data.published_at,
    )
    .first<Comment>();
}

export async function moderateComment(
  db: D1Database,
  id: number,
  status: "approved" | "held" | "rejected",
): Promise<boolean> {
  const result = await db
    .prepare(
      "UPDATE comments SET moderation_status = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(status, id)
    .run();
  return result.meta.changes > 0;
}

export async function deleteComment(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM comments WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
