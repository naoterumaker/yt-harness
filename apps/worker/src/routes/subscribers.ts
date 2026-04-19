import { Hono } from "hono";
import { subscribers } from "@yt-harness/db";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/subscribers
route.get("/", async (c) => {
  const channel = c.get("channel");
  const list = await subscribers.listSubscribers(
    c.env.DB,
    channel.channel_id,
  );
  return c.json({ subscribers: list });
});

// POST /api/channels/:channelId/subscribers/sync
route.post("/sync", async (c) => {
  const channel = c.get("channel");

  // Fetch channel stats for subscriber count
  const resp = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channel.channel_id}`,
    { headers: { Authorization: `Bearer ${channel.access_token}` } },
  );

  if (!resp.ok) {
    return c.json({ error: "YouTube API error" }, 502);
  }

  const data = (await resp.json()) as {
    items: Array<{ statistics: { subscriberCount: string } }>;
  };

  const count = Number(data.items?.[0]?.statistics?.subscriberCount ?? 0);
  const today = new Date().toISOString().slice(0, 10);

  // チャンネル全体の登録者数を直接 DB に記録
  await c.env.DB.prepare(
    `INSERT OR REPLACE INTO analytics_daily (channel_id, video_id, analytics_date, subscribers_gained, views, updated_at)
     VALUES (?, '__CHANNEL__', ?, 0, 0, datetime('now'))
     ON CONFLICT (channel_id, video_id, analytics_date) DO UPDATE SET
       updated_at = datetime('now')`
  ).bind(channel.channel_id, today).run();

  return c.json({ synced: true, subscriber_count: count, date: today });
});

// GET /api/channels/:channelId/subscribers/snapshots
route.get("/snapshots", async (c) => {
  const channel = c.get("channel");
  const list = await subscribers.listSnapshots(c.env.DB, channel.channel_id);
  return c.json({ snapshots: list });
});

export default route;
