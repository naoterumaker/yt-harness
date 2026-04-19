import { Hono } from "hono";
import { changeLog } from "@yt-harness/db";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// POST /api/channels/:channelId/changelog — create change log entry
route.post("/", async (c) => {
  const channel = c.get("channel");
  const body = await c.req.json();

  const {
    video_id,
    change_type,
    changed_at,
    effective_analytics_date,
    note,
    before_value,
    after_value,
    impact_score,
    created_by,
  } = body;

  if (!change_type || !changed_at) {
    return c.json(
      { error: "change_type and changed_at are required" },
      400,
    );
  }

  const entry = await changeLog.insertChangeLog(c.env.DB, {
    channel_id: channel.channel_id,
    video_id: video_id ?? "__CHANNEL__",
    change_type,
    changed_at,
    effective_analytics_date: effective_analytics_date ?? null,
    note: note ?? null,
    before_value: before_value ?? null,
    after_value: after_value ?? null,
    impact_score: impact_score ?? null,
    created_by: created_by ?? "mcp",
  });

  return c.json({ ok: true, data: entry }, 201);
});

// GET /api/channels/:channelId/changelog?start_date=&end_date=&video_id=
route.get("/", async (c) => {
  const channel = c.get("channel");
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  const videoId = c.req.query("video_id");

  let entries;
  if (videoId) {
    entries = await changeLog.getByVideoId(
      c.env.DB,
      videoId,
      startDate,
      endDate,
    );
  } else {
    entries = await changeLog.getByChannelId(
      c.env.DB,
      channel.channel_id,
      startDate,
      endDate,
    );
  }

  return c.json({
    channel_id: channel.channel_id,
    count: entries.length,
    data: entries,
  });
});

export default route;
