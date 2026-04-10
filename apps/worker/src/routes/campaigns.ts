import { Hono } from "hono";
import { campaigns } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/campaigns
route.get("/", async (c) => {
  const channel = c.get("channel");
  const list = await campaigns.listCampaigns(c.env.DB, channel.channel_id);
  return c.json({ campaigns: list });
});

// GET /api/channels/:channelId/campaigns/:id
route.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const campaign = await campaigns.getCampaign(c.env.DB, id);
  if (!campaign) throw new NotFoundError("Campaign");
  return c.json({ campaign });
});

// POST /api/channels/:channelId/campaigns
route.post("/", async (c) => {
  const channel = c.get("channel");
  const body = await c.req.json();
  const campaign = await campaigns.createCampaign(c.env.DB, {
    channel_id: channel.channel_id,
    ...body,
  });
  return c.json({ campaign }, 201);
});

// PUT /api/channels/:channelId/campaigns/:id
route.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const campaign = await campaigns.updateCampaign(c.env.DB, id, body);
  if (!campaign) throw new NotFoundError("Campaign");
  return c.json({ campaign });
});

// DELETE /api/channels/:channelId/campaigns/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await campaigns.deleteCampaign(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Campaign");
  return c.json({ deleted: true });
});

export default route;
