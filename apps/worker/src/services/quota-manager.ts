import { quotaUsage, channels } from "@yt-harness/db";

/**
 * Quota management service.
 * - Daily reset happens naturally since quota_usage tracks used_at timestamp
 *   and getDailyTotal filters by date('now').
 * - Threshold alerts: check if usage exceeds alert threshold.
 */
export async function checkQuotaAlerts(
  db: D1Database,
): Promise<{ alerts: Array<{ channel_id: string; remaining: number }> }> {
  const allChannels = await channels.listChannels(db);
  const alerts: Array<{ channel_id: string; remaining: number }> = [];

  for (const channel of allChannels) {
    const dailyTotal = await quotaUsage.getDailyTotal(
      db,
      channel.channel_id,
    );
    const remaining = channel.daily_quota_limit - dailyTotal;

    if (remaining <= channel.quota_alert_threshold) {
      alerts.push({
        channel_id: channel.channel_id,
        remaining,
      });
      console.warn(
        `Quota alert: channel ${channel.channel_id} has ${remaining} units remaining`,
      );
    }
  }

  return { alerts };
}

/**
 * Record quota usage for an API call.
 */
export async function recordUsage(
  db: D1Database,
  channelId: string,
  operation: string,
  units: number,
) {
  return quotaUsage.addQuotaUsage(db, channelId, operation, units);
}
