import { Hono } from "hono";
import { tags } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/tags
route.get("/", async (c) => {
  const channel = c.get("channel");
  const list = await tags.listTags(c.env.DB, channel.channel_id);
  return c.json({ tags: list });
});

// POST /api/channels/:channelId/tags
route.post("/", async (c) => {
  const channel = c.get("channel");
  const body = await c.req.json<{ name: string; color?: string }>();
  if (!body.name) throw new ValidationError("name is required");

  const tag = await tags.createTag(c.env.DB, {
    channel_id: channel.channel_id,
    name: body.name,
    color: body.color ?? "#3b82f6",
  });
  return c.json({ tag }, 201);
});

// DELETE /api/channels/:channelId/tags/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await tags.deleteTag(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Tag");
  return c.json({ deleted: true });
});

// POST /api/channels/:channelId/tags/:id/subscribers
route.post("/:id/subscribers", async (c) => {
  const tagId = Number(c.req.param("id"));
  const body = await c.req.json<{ subscriber_id: number }>();
  if (!body.subscriber_id)
    throw new ValidationError("subscriber_id is required");

  const result = await tags.tagSubscriber(
    c.env.DB,
    body.subscriber_id,
    tagId,
  );
  return c.json({ subscriber_tag: result }, 201);
});

// DELETE /api/channels/:channelId/tags/:id/subscribers/:subscriberId
route.delete("/:id/subscribers/:subscriberId", async (c) => {
  const tagId = Number(c.req.param("id"));
  const subscriberId = Number(c.req.param("subscriberId"));
  const deleted = await tags.untagSubscriber(c.env.DB, subscriberId, tagId);
  if (!deleted) throw new NotFoundError("Subscriber tag");
  return c.json({ deleted: true });
});

export default route;
