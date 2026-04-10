import { Hono } from "hono";
import { quotaUsage, channels } from "@yt-harness/db";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

route.get("/", async (c) => {
  let dbConnected = false;
  let quotaRemaining: number | null = null;

  try {
    const allChannels = await channels.listChannels(c.env.DB);
    dbConnected = true;

    if (allChannels.length > 0) {
      const ch = allChannels[0];
      const dailyTotal = await quotaUsage.getDailyTotal(c.env.DB, ch.channel_id);
      quotaRemaining = ch.daily_quota_limit - dailyTotal;
    }
  } catch {
    dbConnected = false;
  }

  return c.json({
    status: "ok",
    quota_remaining: quotaRemaining,
    db_connected: dbConnected,
  });
});

export default route;
