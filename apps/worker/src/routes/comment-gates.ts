import { Hono } from "hono";
import { commentGates } from "@yt-harness/db";
import { NotFoundError } from "../errors/index.js";
import { processGates } from "../services/gate-processor.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/gates
route.get("/", async (c) => {
  const channel = c.get("channel");
  const list = await commentGates.listGates(c.env.DB, channel.channel_id);
  return c.json({ gates: list });
});

// GET /api/channels/:channelId/gates/:id
route.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const gate = await commentGates.getGate(c.env.DB, id);
  if (!gate) throw new NotFoundError("Comment Gate");
  return c.json({ gate });
});

// POST /api/channels/:channelId/gates
route.post("/", async (c) => {
  const channel = c.get("channel");
  const body = await c.req.json();
  const gate = await commentGates.createGate(c.env.DB, {
    channel_id: channel.channel_id,
    ...body,
  });
  return c.json({ gate }, 201);
});

// PUT /api/channels/:channelId/gates/:id
route.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const gate = await commentGates.updateGate(c.env.DB, id, body);
  if (!gate) throw new NotFoundError("Comment Gate");
  return c.json({ gate });
});

// DELETE /api/channels/:channelId/gates/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await commentGates.deleteGate(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Comment Gate");
  return c.json({ deleted: true });
});

// POST /api/channels/:channelId/gates/process — Manually trigger processing
route.post("/process", async (c) => {
  const channel = c.get("channel");
  const result = await processGates(c.env.DB, channel);
  return c.json({ result });
});

// GET /api/channels/:channelId/gates/:id/deliveries
route.get("/:id/deliveries", async (c) => {
  const id = Number(c.req.param("id"));
  const deliveries = await commentGates.listDeliveries(c.env.DB, id);
  return c.json({ deliveries });
});

// GET /api/channels/:channelId/gates/:id/analytics
route.get("/:id/analytics", async (c) => {
  const id = Number(c.req.param("id"));
  const deliveries = await commentGates.listDeliveries(c.env.DB, id);

  const total = deliveries.length;
  const delivered = deliveries.filter(
    (d) => d.delivery_status === "delivered",
  ).length;
  const failed = deliveries.filter(
    (d) => d.delivery_status === "failed",
  ).length;
  const skipped = deliveries.filter(
    (d) => d.delivery_status === "skipped_lottery",
  ).length;

  return c.json({
    analytics: { total, delivered, failed, skipped_lottery: skipped },
  });
});

export default route;
