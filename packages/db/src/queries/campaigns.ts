import type { Campaign } from "@yt-harness/shared";

export async function getCampaign(
  db: D1Database,
  id: number,
): Promise<Campaign | null> {
  return db
    .prepare("SELECT * FROM campaigns WHERE id = ?")
    .bind(id)
    .first<Campaign>();
}

export async function listCampaigns(
  db: D1Database,
  channelId: string,
): Promise<Campaign[]> {
  const { results } = await db
    .prepare("SELECT * FROM campaigns WHERE channel_id = ? ORDER BY created_at DESC")
    .bind(channelId)
    .all<Campaign>();
  return results;
}

export async function createCampaign(
  db: D1Database,
  data: Omit<Campaign, "id" | "created_at" | "updated_at">,
): Promise<Campaign | null> {
  return db
    .prepare(
      `INSERT INTO campaigns (channel_id, name, description, gate_id, sequence_id, status, starts_at, ends_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(
      data.channel_id,
      data.name,
      data.description,
      data.gate_id,
      data.sequence_id,
      data.status,
      data.starts_at,
      data.ends_at,
    )
    .first<Campaign>();
}

export async function updateCampaign(
  db: D1Database,
  id: number,
  data: Partial<Omit<Campaign, "id" | "created_at" | "updated_at">>,
): Promise<Campaign | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.channel_id !== undefined) { fields.push("channel_id = ?"); values.push(data.channel_id); }
  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.gate_id !== undefined) { fields.push("gate_id = ?"); values.push(data.gate_id); }
  if (data.sequence_id !== undefined) { fields.push("sequence_id = ?"); values.push(data.sequence_id); }
  if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }
  if (data.starts_at !== undefined) { fields.push("starts_at = ?"); values.push(data.starts_at); }
  if (data.ends_at !== undefined) { fields.push("ends_at = ?"); values.push(data.ends_at); }

  if (fields.length === 0) return getCampaign(db, id);

  fields.push("updated_at = datetime('now')");
  values.push(id);

  return db
    .prepare(`UPDATE campaigns SET ${fields.join(", ")} WHERE id = ? RETURNING *`)
    .bind(...values)
    .first<Campaign>();
}

export async function deleteCampaign(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM campaigns WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
