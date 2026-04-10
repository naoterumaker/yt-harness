import type { CommentGate, CommentGateDelivery } from "@yt-harness/shared";

export async function getGate(
  db: D1Database,
  id: number,
): Promise<CommentGate | null> {
  return db
    .prepare("SELECT * FROM comment_gates WHERE id = ?")
    .bind(id)
    .first<CommentGate>();
}

export async function listGates(
  db: D1Database,
  channelId: string,
): Promise<CommentGate[]> {
  const { results } = await db
    .prepare("SELECT * FROM comment_gates WHERE channel_id = ? ORDER BY created_at DESC")
    .bind(channelId)
    .all<CommentGate>();
  return results;
}

export async function createGate(
  db: D1Database,
  data: Omit<CommentGate, "id" | "created_at" | "updated_at">,
): Promise<CommentGate | null> {
  return db
    .prepare(
      `INSERT INTO comment_gates (channel_id, video_id, name, trigger, trigger_keyword, action, reply_template, lottery_rate, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.video_id,
      data.name,
      data.trigger,
      data.trigger_keyword,
      data.action,
      data.reply_template,
      data.lottery_rate,
      data.is_active ? 1 : 0,
    )
    .first<CommentGate>();
}

export async function updateGate(
  db: D1Database,
  id: number,
  data: Partial<Omit<CommentGate, "id" | "created_at" | "updated_at">>,
): Promise<CommentGate | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.channel_id !== undefined) { fields.push("channel_id = ?"); values.push(data.channel_id); }
  if (data.video_id !== undefined) { fields.push("video_id = ?"); values.push(data.video_id); }
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.trigger !== undefined) { fields.push("trigger = ?"); values.push(data.trigger); }
  if (data.trigger_keyword !== undefined) { fields.push("trigger_keyword = ?"); values.push(data.trigger_keyword); }
  if (data.action !== undefined) { fields.push("action = ?"); values.push(data.action); }
  if (data.reply_template !== undefined) { fields.push("reply_template = ?"); values.push(data.reply_template); }
  if (data.lottery_rate !== undefined) { fields.push("lottery_rate = ?"); values.push(data.lottery_rate); }
  if (data.is_active !== undefined) { fields.push("is_active = ?"); values.push(data.is_active ? 1 : 0); }

  if (fields.length === 0) return getGate(db, id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  return db
    .prepare(`UPDATE comment_gates SET ${fields.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first<CommentGate>();
}

export async function deleteGate(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM comment_gates WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

export async function listDeliveries(
  db: D1Database,
  gateId: number,
): Promise<CommentGateDelivery[]> {
  const { results } = await db
    .prepare("SELECT * FROM comment_gate_deliveries WHERE gate_id = ? ORDER BY delivered_at DESC")
    .bind(gateId)
    .all<CommentGateDelivery>();
  return results;
}

export async function createDelivery(
  db: D1Database,
  data: Omit<CommentGateDelivery, "id">,
): Promise<CommentGateDelivery | null> {
  return db
    .prepare(
      `INSERT INTO comment_gate_deliveries (gate_id, subscriber_id, youtube_channel_id, comment_id, delivered_at, delivery_status)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
      data.gate_id,
      data.subscriber_id,
      data.youtube_channel_id,
      data.comment_id,
      data.delivered_at,
      data.delivery_status,
    )
    .first<CommentGateDelivery>();
}
