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

// GET /api/channels/:channelId/subscribers/snapshots
route.get("/snapshots", async (c) => {
  const channel = c.get("channel");
  const list = await subscribers.listSnapshots(c.env.DB, channel.channel_id);
  return c.json({ snapshots: list });
});

export default route;
