import { videos, metricsSnapshots } from "@yt-harness/db";
import type { YtChannel } from "@yt-harness/shared";
import type { Env } from "../middleware/auth.js";

/**
 * Get the current date in Pacific Time (America/Los_Angeles).
 */
function getPacificDateString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives YYYY-MM-DD format
  return formatter.format(now);
}

/**
 * Sync video metrics snapshots for a channel.
 *
 * Fetches current statistics for all videos in the channel from the
 * YouTube Data API v3 `videos.list` endpoint, then upserts each into
 * video_metrics_snapshots with today's PT date.
 */
export async function syncMetricsSnapshots(
  env: Env,
  channel: YtChannel,
): Promise<{ upserted: number; errors: number }> {
  const snapshotDate = getPacificDateString();
  let upserted = 0;
  let errors = 0;

  // Get all videos for this channel from the DB
  const channelVideos = await videos.listVideos(env.DB, channel.channel_id);

  if (channelVideos.length === 0) {
    return { upserted: 0, errors: 0 };
  }

  // Process in batches of 50 (YouTube API limit)
  for (let i = 0; i < channelVideos.length; i += 50) {
    const batch = channelVideos.slice(i, i + 50);
    const videoIds = batch.map((v) => v.video_id).join(",");

    try {
      const resp = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`,
        {
          headers: { Authorization: `Bearer ${channel.access_token}` },
        },
      );

      if (!resp.ok) {
        console.error(
          `[metrics-snapshot] YouTube API error for channel ${channel.channel_id}:`,
          await resp.text(),
        );
        errors += batch.length;
        continue;
      }

      const data = (await resp.json()) as {
        items: Array<{
          id: string;
          statistics: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
          };
        }>;
      };

      for (const item of data.items) {
        try {
          await metricsSnapshots.upsertSnapshot(env.DB, {
            video_id: item.id,
            channel_id: channel.channel_id,
            snapshot_date: snapshotDate,
            view_count: Number(item.statistics.viewCount ?? 0),
            like_count: Number(item.statistics.likeCount ?? 0),
            comment_count: Number(item.statistics.commentCount ?? 0),
          });
          upserted++;
        } catch (err) {
          console.error(
            `[metrics-snapshot] Failed to upsert snapshot for video ${item.id}:`,
            err,
          );
          errors++;
        }
      }
    } catch (err) {
      console.error(
        `[metrics-snapshot] Fetch error for batch starting at index ${i}:`,
        err,
      );
      errors += batch.length;
    }
  }

  return { upserted, errors };
}
