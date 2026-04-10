import type { Setting } from "@yt-harness/shared";

export async function getSetting(
  db: D1Database,
  key: string,
): Promise<string | null> {
  const row = await db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

export async function setSetting(
  db: D1Database,
  key: string,
  value: string,
): Promise<Setting | null> {
  return db
    .prepare(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET
         value = excluded.value,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(key, value)
    .first<Setting>();
}

export async function getAllSettings(
  db: D1Database,
): Promise<Setting[]> {
  const { results } = await db
    .prepare("SELECT * FROM settings ORDER BY key ASC")
    .all<Setting>();
  return results;
}
