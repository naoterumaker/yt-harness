import type {
  CommentSequence,
  SequenceMessage,
  SequenceEnrollment,
} from "@yt-harness/shared";

export async function getSequence(
  db: D1Database,
  id: number,
): Promise<CommentSequence | null> {
  return db
    .prepare("SELECT * FROM comment_sequences WHERE id = ?")
    .bind(id)
    .first<CommentSequence>();
}

export async function listSequences(
  db: D1Database,
  channelId: string,
): Promise<CommentSequence[]> {
  const { results } = await db
    .prepare("SELECT * FROM comment_sequences WHERE channel_id = ? ORDER BY created_at DESC")
    .bind(channelId)
    .all<CommentSequence>();
  return results;
}

export async function createSequence(
  db: D1Database,
  data: Omit<CommentSequence, "id" | "created_at" | "updated_at">,
): Promise<CommentSequence | null> {
  return db
    .prepare(
      `INSERT INTO comment_sequences (channel_id, name, description, is_active)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(data.channel_id, data.name, data.description, data.is_active ? 1 : 0)
    .first<CommentSequence>();
}

export async function addMessage(
  db: D1Database,
  data: Omit<SequenceMessage, "id" | "created_at">,
): Promise<SequenceMessage | null> {
  return db
    .prepare(
      `INSERT INTO sequence_messages (sequence_id, step_order, delay_minutes, message_template)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(data.sequence_id, data.step_order, data.delay_minutes, data.message_template)
    .first<SequenceMessage>();
}

export async function listMessages(
  db: D1Database,
  sequenceId: number,
): Promise<SequenceMessage[]> {
  const { results } = await db
    .prepare("SELECT * FROM sequence_messages WHERE sequence_id = ? ORDER BY step_order ASC")
    .bind(sequenceId)
    .all<SequenceMessage>();
  return results;
}

export async function enroll(
  db: D1Database,
  data: Omit<SequenceEnrollment, "id" | "enrolled_at" | "last_sent_at" | "updated_at">,
): Promise<SequenceEnrollment | null> {
  return db
    .prepare(
      `INSERT INTO sequence_enrollments (sequence_id, subscriber_id, current_step, status)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(data.sequence_id, data.subscriber_id, data.current_step, data.status)
    .first<SequenceEnrollment>();
}

export async function advanceStep(
  db: D1Database,
  enrollmentId: number,
): Promise<SequenceEnrollment | null> {
  return db
    .prepare(
      `UPDATE sequence_enrollments
       SET current_step = current_step + 1, last_sent_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?
       RETURNING *`,
    )
    .bind(enrollmentId)
    .first<SequenceEnrollment>();
}

export async function listEnrollments(
  db: D1Database,
  sequenceId: number,
): Promise<SequenceEnrollment[]> {
  const { results } = await db
    .prepare("SELECT * FROM sequence_enrollments WHERE sequence_id = ? ORDER BY enrolled_at DESC")
    .bind(sequenceId)
    .all<SequenceEnrollment>();
  return results;
}
