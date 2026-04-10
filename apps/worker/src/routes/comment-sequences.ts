import { Hono } from "hono";
import { commentSequences } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/sequences
route.get("/", async (c) => {
  const channel = c.get("channel");
  const list = await commentSequences.listSequences(
    c.env.DB,
    channel.channel_id,
  );
  return c.json({ sequences: list });
});

// GET /api/channels/:channelId/sequences/:id
route.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const seq = await commentSequences.getSequence(c.env.DB, id);
  if (!seq) throw new NotFoundError("Sequence");
  return c.json({ sequence: seq });
});

// POST /api/channels/:channelId/sequences
route.post("/", async (c) => {
  const channel = c.get("channel");
  const body = await c.req.json();
  const seq = await commentSequences.createSequence(c.env.DB, {
    channel_id: channel.channel_id,
    ...body,
  });
  return c.json({ sequence: seq }, 201);
});

// GET /api/channels/:channelId/sequences/:id/messages
route.get("/:id/messages", async (c) => {
  const id = Number(c.req.param("id"));
  const messages = await commentSequences.listMessages(c.env.DB, id);
  return c.json({ messages });
});

// POST /api/channels/:channelId/sequences/:id/messages
route.post("/:id/messages", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const msg = await commentSequences.addMessage(c.env.DB, {
    sequence_id: id,
    ...body,
  });
  return c.json({ message: msg }, 201);
});

// GET /api/channels/:channelId/sequences/:id/enrollments
route.get("/:id/enrollments", async (c) => {
  const id = Number(c.req.param("id"));
  const list = await commentSequences.listEnrollments(c.env.DB, id);
  return c.json({ enrollments: list });
});

// POST /api/channels/:channelId/sequences/:id/enrollments
route.post("/:id/enrollments", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json<{ subscriber_id: number }>();
  if (!body.subscriber_id)
    throw new ValidationError("subscriber_id is required");

  const enrollment = await commentSequences.enroll(c.env.DB, {
    sequence_id: id,
    subscriber_id: body.subscriber_id,
    current_step: 0,
    status: "active",
  });
  return c.json({ enrollment }, 201);
});

export default route;
