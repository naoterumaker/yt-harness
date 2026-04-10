import { commentSequences } from "@yt-harness/db";
import type { YtChannel } from "@yt-harness/shared";

/**
 * Process active sequence enrollments:
 * - Check each active enrollment
 * - If delay has elapsed since last_sent_at, advance to next step and send message
 */
export async function processSequences(
  db: D1Database,
  channel: YtChannel,
): Promise<{ advanced: number }> {
  const sequences = await commentSequences.listSequences(
    db,
    channel.channel_id,
  );
  const activeSequences = sequences.filter((s) => s.is_active);

  let advanced = 0;

  for (const seq of activeSequences) {
    const enrollments = await commentSequences.listEnrollments(db, seq.id);
    const activeEnrollments = enrollments.filter(
      (e) => e.status === "active",
    );
    const messages = await commentSequences.listMessages(db, seq.id);

    for (const enrollment of activeEnrollments) {
      const nextStep = enrollment.current_step + 1;
      const nextMessage = messages.find((m) => m.step_order === nextStep);

      if (!nextMessage) {
        // Sequence complete — mark as completed
        // Use raw SQL since there's no dedicated query for status update
        await db
          .prepare(
            "UPDATE sequence_enrollments SET status = 'completed', updated_at = datetime('now') WHERE id = ?",
          )
          .bind(enrollment.id)
          .run();
        continue;
      }

      // Check if delay has elapsed
      const lastSent = enrollment.last_sent_at
        ? new Date(enrollment.last_sent_at)
        : new Date(enrollment.enrolled_at);
      const delayMs = nextMessage.delay_minutes * 60 * 1000;
      const now = Date.now();

      if (now - lastSent.getTime() < delayMs) continue;

      // Send the message (YouTube comment reply or similar)
      // For MVP, we just advance the step — actual delivery depends on integration
      await commentSequences.advanceStep(db, enrollment.id);
      advanced++;
    }
  }

  return { advanced };
}
