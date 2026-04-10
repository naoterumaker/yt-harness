import { videos, channels } from "@yt-harness/db";
import type { YtChannel } from "@yt-harness/shared";

/**
 * Check for scheduled video publishes and execute them.
 * Videos with status='scheduled' and scheduled_at <= now are published.
 */
export async function checkScheduledPublishes(
  db: D1Database,
  channel: YtChannel,
): Promise<{ published: number }> {
  const allVideos = await videos.listVideos(db, channel.channel_id);
  const now = new Date();
  let published = 0;

  for (const video of allVideos) {
    if (video.status !== "scheduled" || !video.scheduled_at) continue;

    const scheduledAt = new Date(video.scheduled_at);
    if (scheduledAt > now) continue;

    // Call YouTube API to set video status to public
    try {
      const resp = await fetch(
        "https://www.googleapis.com/youtube/v3/videos?part=status",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${channel.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: video.video_id,
            status: { privacyStatus: "public" },
          }),
        },
      );

      if (resp.ok) {
        await videos.upsertVideo(db, {
          ...video,
          status: "public",
          published_at: now.toISOString(),
        });
        published++;
      }
    } catch {
      console.error(`Failed to publish video ${video.video_id}`);
    }
  }

  return { published };
}
