import type { StaffMember } from "@yt-harness/shared";

export async function listStaff(db: D1Database): Promise<StaffMember[]> {
  const { results } = await db
    .prepare("SELECT * FROM staff_members ORDER BY created_at DESC")
    .all<StaffMember>();
  return results;
}

export async function getStaffByEmail(
  db: D1Database,
  email: string,
): Promise<StaffMember | null> {
  return db
    .prepare("SELECT * FROM staff_members WHERE email = ?")
    .bind(email)
    .first<StaffMember>();
}

export async function upsertStaff(
  db: D1Database,
  data: Omit<StaffMember, "id" | "created_at" | "updated_at">,
): Promise<StaffMember | null> {
  return db
    .prepare(
      `INSERT INTO staff_members (email, name, role)
       VALUES (?, ?, ?)
       ON CONFLICT (email) DO UPDATE SET
         name = excluded.name,
         role = excluded.role,
         updated_at = datetime('now')
       RETURNING *`,
    )
    .bind(data.email, data.name, data.role)
    .first<StaffMember>();
}

export async function deleteStaff(
  db: D1Database,
  id: number,
): Promise<boolean> {
  const result = await db
    .prepare("DELETE FROM staff_members WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}
