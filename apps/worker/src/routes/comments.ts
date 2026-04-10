import { Hono } from "hono";
import { comments } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/comments
route.get("/", async (c) => {
  const channel = c.get("channel");
  const videoId = c.req.query("video_id");

  const list = videoId
    ? await comments.listComments(c.env.DB, videoId)
    : await comments.listCommentsByChannel(c.env.DB, channel.channel_id);

  return c.json({ comments: list });
});

// GET /api/channels/:channelId/comments/:id
route.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const comment = await comments.getComment(c.env.DB, id);
  if (!comment) throw new NotFoundError("Comment");
  return c.json({ comment });
});

// POST /api/channels/:channelId/comments
route.post("/", async (c) => {
  const body = await c.req.json();
  const comment = await comments.upsertComment(c.env.DB, body);
  return c.json({ comment }, 201);
});

// DELETE /api/channels/:channelId/comments/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await comments.deleteComment(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Comment");
  return c.json({ deleted: true });
});

// POST /api/channels/:channelId/comments/:id/moderate
route.post("/:id/moderate", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ status: "approved" | "held" | "rejected" }>();
  if (!body.status) throw new ValidationError("status is required");

  const ok = await comments.moderateComment(c.env.DB, id, body.status);
  if (!ok) throw new NotFoundError("Comment");
  return c.json({ moderated: true });
});

export default route;
