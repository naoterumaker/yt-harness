import { quotaUsage } from "@yt-harness/db";

/** YouTube Data API v3 quota costs per operation. */
export const QUOTA_COSTS: Record<string, number> = {
  "videos.list": 1,
  "videos.insert": 1600,
  "videos.update": 50,
  "videos.delete": 50,
  "videos.rate": 50,
  "channels.list": 1,
  "comments.list": 1,
  "comments.insert": 50,
  "comments.update": 50,
  "comments.delete": 50,
  "comments.setModerationStatus": 50,
  "commentThreads.list": 1,
  "playlists.list": 1,
  "playlists.insert": 50,
  "playlists.update": 50,
  "playlists.delete": 50,
  "playlistItems.insert": 50,
  "playlistItems.delete": 50,
  "subscriptions.list": 1,
  "search.list": 100,
  "analytics.query": 1,
};

/** Default daily quota limit (YouTube Data API v3). */
export const DAILY_LIMIT = 10_000;

export class QuotaTracker {
  /**
   * Record quota usage to the database.
   */
  async trackUsage(
    channelId: string,
    operation: string,
    units: number,
    db: D1Database,
  ): Promise<void> {
    await quotaUsage.addQuotaUsage(db, channelId, operation, units);
  }

  /**
   * Get remaining quota for today.
   */
  async getRemainingQuota(
    channelId: string,
    db: D1Database,
  ): Promise<number> {
    const used = await quotaUsage.getDailyTotal(db, channelId);
    return Math.max(DAILY_LIMIT - used, 0);
  }

  /**
   * Check whether the channel can afford the given operation.
   */
  async canAfford(
    channelId: string,
    operation: string,
    db: D1Database,
  ): Promise<boolean> {
    const cost = QUOTA_COSTS[operation] ?? 0;
    const remaining = await this.getRemainingQuota(channelId, db);
    return remaining >= cost;
  }
}
