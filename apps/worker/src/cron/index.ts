import { channels } from "@yt-harness/db";
import { processGates } from "../services/gate-processor.js";
import { processSequences } from "../services/sequence-processor.js";
import { checkScheduledPublishes } from "../services/scheduler.js";
import { trackSubscribers } from "../services/subscriber-tracker.js";
import { checkQuotaAlerts } from "../services/quota-manager.js";
import type { Env } from "../middleware/auth.js";

export async function handleCron(env: Env) {
  console.log("Cron triggered at", new Date().toISOString());

  const allChannels = await channels.listChannels(env.DB);

  for (const channel of allChannels) {
    try {
      // Process comment gates
      const gateResult = await processGates(env.DB, channel);
      console.log(
        `Gates [${channel.channel_id}]: processed=${gateResult.processed}, delivered=${gateResult.delivered}`,
      );

      // Process sequences
      const seqResult = await processSequences(env.DB, channel);
      console.log(
        `Sequences [${channel.channel_id}]: advanced=${seqResult.advanced}`,
      );

      // Check scheduled publishes
      const schedResult = await checkScheduledPublishes(env.DB, channel);
      console.log(
        `Scheduler [${channel.channel_id}]: published=${schedResult.published}`,
      );

      // Track subscribers
      const subResult = await trackSubscribers(env.DB, channel);
      console.log(
        `Subscribers [${channel.channel_id}]: new=${subResult.new_subscribers}`,
      );
    } catch (err) {
      console.error(`Cron error for channel ${channel.channel_id}:`, err);
    }
  }

  // Check quota alerts across all channels
  const quotaAlerts = await checkQuotaAlerts(env.DB);
  if (quotaAlerts.alerts.length > 0) {
    console.warn("Quota alerts:", JSON.stringify(quotaAlerts.alerts));
  }
}
