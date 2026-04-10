import { Hono } from "hono";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/analytics/channel
route.get("/channel", async (c) => {
  const channel = c.get("channel");

  const resp = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channel.channel_id}&startDate=${c.req.query("start_date") ?? "2020-01-01"}&endDate=${c.req.query("end_date") ?? new Date().toISOString().slice(0, 10)}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost&dimensions=day&sort=-day`,
    {
      headers: { Authorization: `Bearer ${channel.access_token}` },
    },
  );

  if (!resp.ok) {
    const err = await resp.text();
    return c.json({ error: "YouTube Analytics API error", details: err }, 502);
  }

  const data = await resp.json();
  return c.json({ analytics: data });
});

// GET /api/channels/:channelId/analytics/video
route.get("/video", async (c) => {
  const channel = c.get("channel");
  const videoId = c.req.query("video_id");

  const filters = videoId ? `&filters=video==${videoId}` : "";

  const resp = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channel.channel_id}&startDate=${c.req.query("start_date") ?? "2020-01-01"}&endDate=${c.req.query("end_date") ?? new Date().toISOString().slice(0, 10)}&metrics=views,likes,comments,estimatedMinutesWatched&dimensions=day&sort=-day${filters}`,
    {
      headers: { Authorization: `Bearer ${channel.access_token}` },
    },
  );

  if (!resp.ok) {
    const err = await resp.text();
    return c.json({ error: "YouTube Analytics API error", details: err }, 502);
  }

  const data = await resp.json();
  return c.json({ analytics: data });
});

export default route;
