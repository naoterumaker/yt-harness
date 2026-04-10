import { Hono } from "hono";
import { quotaUsage, channels } from "@yt-harness/db";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/usage
route.get("/", async (c) => {
  const channel = c.get("channel");
  const dailyTotal = await quotaUsage.getDailyTotal(
    c.env.DB,
    channel.channel_id,
  );
  return c.json({
    channel_id: channel.channel_id,
    daily_limit: channel.daily_quota_limit,
    daily_used: dailyTotal,
    daily_remaining: channel.daily_quota_limit - dailyTotal,
    alert_threshold: channel.quota_alert_threshold,
  });
});

// GET /api/channels/:channelId/usage/history
route.get("/history", async (c) => {
  const channel = c.get("channel");
  const history = await quotaUsage.getWeeklyHistory(
    c.env.DB,
    channel.channel_id,
  );
  return c.json({ history });
});

export default route;
