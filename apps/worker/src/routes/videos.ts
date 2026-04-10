import { Hono } from "hono";
import { videos } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/videos
route.get("/", async (c) => {
  const channel = c.get("channel");
  const list = await videos.listVideos(c.env.DB, channel.channel_id);
  return c.json({ videos: list });
});

// GET /api/channels/:channelId/videos/:id
route.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const video = await videos.getVideo(c.env.DB, id);
  if (!video) throw new NotFoundError("Video");
  return c.json({ video });
});

// POST /api/channels/:channelId/videos
route.post("/", async (c) => {
  const channel = c.get("channel");
  const body = await c.req.json();
  const video = await videos.upsertVideo(c.env.DB, {
    channel_id: channel.channel_id,
    ...body,
  });
  return c.json({ video }, 201);
});

// PUT /api/channels/:channelId/videos/:id
route.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const existing = await videos.getVideo(c.env.DB, id);
  if (!existing) throw new NotFoundError("Video");

  const body = await c.req.json();
  const updated = await videos.upsertVideo(c.env.DB, {
    ...existing,
    ...body,
    channel_id: existing.channel_id,
    video_id: existing.video_id,
  });
  return c.json({ video: updated });
});

// DELETE /api/channels/:channelId/videos/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await videos.deleteVideo(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Video");
  return c.json({ deleted: true });
});

// PUT /api/channels/:channelId/videos/:id/metrics
route.put("/:id/metrics", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{
    view_count: number;
    like_count: number;
    comment_count: number;
  }>();
  const updated = await videos.updateVideoMetrics(c.env.DB, id, body);
  if (!updated) throw new NotFoundError("Video");
  return c.json({ video: updated });
});

// POST /api/channels/:channelId/videos/:id/schedule
route.post("/:id/schedule", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ scheduled_at: string }>();
  if (!body.scheduled_at) throw new ValidationError("scheduled_at is required");

  const existing = await videos.getVideo(c.env.DB, id);
  if (!existing) throw new NotFoundError("Video");

  const updated = await videos.upsertVideo(c.env.DB, {
    ...existing,
    status: "scheduled",
    scheduled_at: body.scheduled_at,
  });
  return c.json({ video: updated });
});

export default route;
