import { channels } from "@yt-harness/db";
import type { YtChannel } from "@yt-harness/shared";
import { processGates } from "../services/gate-processor.js";
import { processSequences } from "../services/sequence-processor.js";
import { checkScheduledPublishes } from "../services/scheduler.js";
import { trackSubscribers } from "../services/subscriber-tracker.js";
import { checkQuotaAlerts } from "../services/quota-manager.js";
import { syncMetricsSnapshots } from "../services/metrics-snapshot.js";
import {
  syncAnalytics,
  syncTrafficSources,
  syncDemographics,
} from "../services/analytics-sync.js";
import type { Env } from "../middleware/auth.js";

/**
 * Refresh the OAuth access token for a channel if it has expired.
 * Returns the updated channel, or the original if refresh fails or is not needed.
 */
async function ensureFreshToken(env: Env, channel: YtChannel): Promise<YtChannel> {
  if (new Date(channel.token_expires_at) >= new Date()) {
    return channel;
  }

  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: channel.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!resp.ok) {
      console.error(
        `[cron] Token refresh failed for channel ${channel.channel_id}: ${resp.status}`,
      );
      return channel;
    }

    const data = (await resp.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    const expiresAt = new Date(
      Date.now() + data.expires_in * 1000,
    ).toISOString();

    const updated = await channels.updateTokens(env.DB, channel.id, {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? channel.refresh_token,
      token_expires_at: expiresAt,
    });

    return updated ?? channel;
  } catch (err) {
    console.error(
      `[cron] Token refresh error for channel ${channel.channel_id}:`,
      err,
    );
    return channel;
  }
}

export async function handleCron(env: Env) {
  console.log("Cron triggered at", new Date().toISOString());

  const allChannels = await channels.listChannels(env.DB);

  for (const rawChannel of allChannels) {
    // Refresh token if expired before running any jobs
    const channel = await ensureFreshToken(env, rawChannel);

    try {
      // Process comment gates
      const gateResult = await processGates(env.DB, channel);
      console.log(
        `Gates [${channel.channel_id}]: processed=${gateResult.processed}, delivered=${gateResult.delivered}`,
      );
    } catch (err) {
      console.error(`[cron] Gates error for channel ${channel.channel_id}:`, err);
    }

    try {
      // Process sequences
      const seqResult = await processSequences(env.DB, channel);
      console.log(
        `Sequences [${channel.channel_id}]: advanced=${seqResult.advanced}`,
      );
    } catch (err) {
      console.error(`[cron] Sequences error for channel ${channel.channel_id}:`, err);
    }

    try {
      // Check scheduled publishes
      const schedResult = await checkScheduledPublishes(env.DB, channel);
      console.log(
        `Scheduler [${channel.channel_id}]: published=${schedResult.published}`,
      );
    } catch (err) {
      console.error(`[cron] Scheduler error for channel ${channel.channel_id}:`, err);
    }

    try {
      // Track subscribers
      const subResult = await trackSubscribers(env.DB, channel);
      console.log(
        `Subscribers [${channel.channel_id}]: new=${subResult.new_subscribers}`,
      );
    } catch (err) {
      console.error(`[cron] Subscribers error for channel ${channel.channel_id}:`, err);
    }

    // --- Analytics sync jobs ---

    try {
      // Metrics snapshot (video-level stats from Data API)
      const metricsResult = await syncMetricsSnapshots(env, channel);
      console.log(
        `MetricsSnapshot [${channel.channel_id}]: upserted=${metricsResult.upserted}, errors=${metricsResult.errors}`,
      );
    } catch (err) {
      console.error(`[cron] MetricsSnapshot error for channel ${channel.channel_id}:`, err);
    }

    try {
      // Analytics daily sync (channel-level from Analytics API)
      const analyticsResult = await syncAnalytics(env, channel);
      console.log(
        `AnalyticsDaily [${channel.channel_id}]: upserted=${analyticsResult.upserted}`,
      );
    } catch (err) {
      console.error(`[cron] AnalyticsDaily error for channel ${channel.channel_id}:`, err);
    }

    try {
      // Traffic sources sync
      const trafficResult = await syncTrafficSources(env, channel);
      console.log(
        `TrafficSources [${channel.channel_id}]: upserted=${trafficResult.upserted}`,
      );
    } catch (err) {
      console.error(`[cron] TrafficSources error for channel ${channel.channel_id}:`, err);
    }

    try {
      // Demographics sync
      const demoResult = await syncDemographics(env, channel);
      console.log(
        `Demographics [${channel.channel_id}]: upsertedPct=${demoResult.upsertedPct}, upsertedCounts=${demoResult.upsertedCounts}`,
      );
    } catch (err) {
      console.error(`[cron] Demographics error for channel ${channel.channel_id}:`, err);
    }
  }

  // Check quota alerts across all channels
  const quotaAlerts = await checkQuotaAlerts(env.DB);
  if (quotaAlerts.alerts.length > 0) {
    console.warn("Quota alerts:", JSON.stringify(quotaAlerts.alerts));
  }
}
