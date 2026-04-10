import { Hono } from "hono";
import { channels } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels
route.get("/", async (c) => {
  const list = await channels.listChannels(c.env.DB);
  return c.json({ channels: list });
});

// GET /api/channels/:id
route.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const channel = await channels.getChannel(c.env.DB, id);
  if (!channel) throw new NotFoundError("Channel");
  return c.json({ channel });
});

// PUT /api/channels/:id
route.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const existing = await channels.getChannel(c.env.DB, id);
  if (!existing) throw new NotFoundError("Channel");

  const body = await c.req.json<{
    daily_quota_limit?: number;
    quota_alert_threshold?: number;
  }>();

  const updated = await channels.upsertChannel(c.env.DB, {
    channel_id: existing.channel_id,
    channel_title: existing.channel_title,
    channel_thumbnail: existing.channel_thumbnail,
    access_token: existing.access_token,
    refresh_token: existing.refresh_token,
    token_expires_at: existing.token_expires_at,
    daily_quota_limit: body.daily_quota_limit ?? existing.daily_quota_limit,
    quota_alert_threshold:
      body.quota_alert_threshold ?? existing.quota_alert_threshold,
  });

  return c.json({ channel: updated });
});

// DELETE /api/channels/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await channels.deleteChannel(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Channel");
  return c.json({ deleted: true });
});

export default route;
