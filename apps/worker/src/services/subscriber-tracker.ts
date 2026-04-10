import { subscribers } from "@yt-harness/db";
import type { YtChannel } from "@yt-harness/shared";

/**
 * Fetch subscribers from YouTube API, diff with DB, create snapshots.
 */
export async function trackSubscribers(
  db: D1Database,
  channel: YtChannel,
): Promise<{ new_subscribers: number; snapshot_created: boolean }> {
  let newCount = 0;

  try {
    // Fetch subscriber list from YouTube
    const resp = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?part=subscriberSnippet&myRecentSubscribers=true&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${channel.access_token}` },
      },
    );

    if (!resp.ok) {
      return { new_subscribers: 0, snapshot_created: false };
    }

    const data = (await resp.json()) as {
      items?: Array<{
        subscriberSnippet: {
          channelId: string;
          title: string;
          thumbnails: { default: { url: string } };
        };
      }>;
    };

    for (const item of data.items ?? []) {
      const s = item.subscriberSnippet;
      const existing = await findSubscriberByYTChannelId(
        db,
        channel.channel_id,
        s.channelId,
      );

      await subscribers.upsertSubscriber(db, {
        channel_id: channel.channel_id,
        youtube_channel_id: s.channelId,
        display_name: s.title,
        profile_image_url: s.thumbnails.default.url,
        subscribed_at: new Date().toISOString(),
        is_active: true,
      });

      if (!existing) newCount++;
    }

    // Create snapshot with total subscriber count
    const channelStatsResp = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channel.channel_id}`,
      {
        headers: { Authorization: `Bearer ${channel.access_token}` },
      },
    );

    if (channelStatsResp.ok) {
      const statsData = (await channelStatsResp.json()) as {
        items?: Array<{
          statistics: { subscriberCount: string };
        }>;
      };

      const count = Number(
        statsData.items?.[0]?.statistics.subscriberCount ?? 0,
      );

      // Use channel id=1 as subscriber_id placeholder for channel-level snapshot
      await subscribers.createSnapshot(db, {
        subscriber_id: 0,
        subscriber_count: count,
        snapshot_at: new Date().toISOString(),
      });

      return { new_subscribers: newCount, snapshot_created: true };
    }
  } catch {
    // Swallow errors
  }

  return { new_subscribers: newCount, snapshot_created: false };
}

async function findSubscriberByYTChannelId(
  db: D1Database,
  channelId: string,
  ytChannelId: string,
) {
  return db
    .prepare(
      "SELECT * FROM subscribers WHERE channel_id = ? AND youtube_channel_id = ?",
    )
    .bind(channelId, ytChannelId)
    .first();
}
