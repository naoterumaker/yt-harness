import { Hono } from "hono";
import { analyticsDaily, metricsSnapshots, trafficSources, viewerDemographics } from "@yt-harness/db";
import type { Env } from "../middleware/auth.js";
import { syncAnalytics, syncTrafficSources, syncDemographics } from "../services/analytics-sync.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/analytics/channel
route.get("/channel", async (c) => {
  const channel = c.get("channel");

  const resp = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channel.channel_id}&startDate=${c.req.query("start_date") ?? "2020-01-01"}&endDate=${c.req.query("end_date") ?? new Date().toISOString().slice(0, 10)}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost&dimensions=day&sort=-day`,
    {
      headers: { Authorization: `Bearer ${channel.access_token}` },
    },
  );

  if (!resp.ok) {
    const err = await resp.text();
    return c.json({ error: "YouTube Analytics API error", details: err }, 502);
  }

  const data = await resp.json();
  return c.json({ analytics: data });
});

// GET /api/channels/:channelId/analytics/video
route.get("/video", async (c) => {
  const channel = c.get("channel");
  const videoId = c.req.query("video_id");

  const filters = videoId ? `&filters=video==${videoId}` : "";

  const resp = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channel.channel_id}&startDate=${c.req.query("start_date") ?? "2020-01-01"}&endDate=${c.req.query("end_date") ?? new Date().toISOString().slice(0, 10)}&metrics=views,likes,comments,estimatedMinutesWatched&dimensions=day&sort=-day${filters}`,
    {
      headers: { Authorization: `Bearer ${channel.access_token}` },
    },
  );

  if (!resp.ok) {
    const err = await resp.text();
    return c.json({ error: "YouTube Analytics API error", details: err }, 502);
  }

  const data = await resp.json();
  return c.json({ analytics: data });
});

// GET /api/channels/:channelId/analytics/videos/:videoId/snapshots
route.get("/videos/:videoId/snapshots", async (c) => {
  const channel = c.get("channel");
  const videoId = c.req.param("videoId");

  const now = new Date();
  const defaultEnd = now.toISOString().slice(0, 10);
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const startDate = c.req.query("start_date") ?? defaultStart;
  const endDate = c.req.query("end_date") ?? defaultEnd;

  const snapshots = await metricsSnapshots.getByVideoId(
    c.env.DB,
    videoId,
    startDate,
    endDate,
  );

  return c.json({
    channel_id: channel.channel_id,
    video_id: videoId,
    start_date: startDate,
    end_date: endDate,
    snapshots,
  });
});

// POST /api/channels/:channelId/analytics/sync — trigger manual analytics sync
route.post("/sync", async (c) => {
  const channel = c.get("channel");

  try {
    const result = await syncAnalytics(c.env, channel);
    return c.json({
      ok: true,
      channel_id: channel.channel_id,
      upserted: result.upserted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "Analytics sync failed", details: message }, 502);
  }
});

// GET /api/channels/:channelId/analytics/daily?start_date=&end_date= — return daily analytics from DB
route.get("/daily", async (c) => {
  const channel = c.get("channel");

  const now = new Date();
  const defaultEnd = now.toISOString().slice(0, 10);
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const startDate = c.req.query("start_date") ?? defaultStart;
  const endDate = c.req.query("end_date") ?? defaultEnd;

  const rows = await analyticsDaily.getByChannelId(
    c.env.DB,
    channel.channel_id,
    startDate,
    endDate,
  );

  return c.json({
    channel_id: channel.channel_id,
    start_date: startDate,
    end_date: endDate,
    count: rows.length,
    data: rows,
  });
});

// GET /api/channels/:channelId/analytics/summary?days=7 — return summary with period comparison
route.get("/summary", async (c) => {
  const channel = c.get("channel");
  const days = Number(c.req.query("days") ?? "7");

  const now = new Date();
  const currentEnd = now.toISOString().slice(0, 10);
  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const previousStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [currentRows, previousRows] = await Promise.all([
    analyticsDaily.getByChannelId(c.env.DB, channel.channel_id, currentStart, currentEnd),
    analyticsDaily.getByChannelId(c.env.DB, channel.channel_id, previousStart, currentStart),
  ]);

  const sumMetrics = (rows: typeof currentRows) => ({
    views: rows.reduce((s, r) => s + (r.views ?? 0), 0),
    estimated_minutes_watched: rows.reduce((s, r) => s + (r.estimated_minutes_watched ?? 0), 0),
    video_thumbnail_impressions: rows.reduce((s, r) => s + (r.video_thumbnail_impressions ?? 0), 0),
    subscribers_gained: rows.reduce((s, r) => s + (r.subscribers_gained ?? 0), 0),
    subscribers_lost: rows.reduce((s, r) => s + (r.subscribers_lost ?? 0), 0),
    likes: rows.reduce((s, r) => s + (r.likes ?? 0), 0),
    comments: rows.reduce((s, r) => s + (r.comments ?? 0), 0),
    shares: rows.reduce((s, r) => s + (r.shares ?? 0), 0),
  });

  const avgMetrics = (rows: typeof currentRows) => {
    const count = rows.length || 1;
    return {
      average_view_duration: rows.reduce((s, r) => s + (r.average_view_duration ?? 0), 0) / count,
      video_thumbnail_impressions_ctr:
        rows.reduce((s, r) => s + (r.video_thumbnail_impressions_ctr ?? 0), 0) / count,
    };
  };

  const current = { ...sumMetrics(currentRows), ...avgMetrics(currentRows) };
  const previous = { ...sumMetrics(previousRows), ...avgMetrics(previousRows) };

  const pctChange = (cur: number, prev: number): number | null => {
    if (prev === 0) return cur > 0 ? 100 : null;
    return Math.round(((cur - prev) / prev) * 10000) / 100;
  };

  return c.json({
    channel_id: channel.channel_id,
    days,
    current_period: { start: currentStart, end: currentEnd, ...current },
    previous_period: { start: previousStart, end: currentStart, ...previous },
    changes: {
      views_pct: pctChange(current.views, previous.views),
      impressions_pct: pctChange(
        current.video_thumbnail_impressions,
        previous.video_thumbnail_impressions,
      ),
      subscribers_gained_pct: pctChange(
        current.subscribers_gained,
        previous.subscribers_gained,
      ),
      likes_pct: pctChange(current.likes, previous.likes),
      comments_pct: pctChange(current.comments, previous.comments),
      shares_pct: pctChange(current.shares, previous.shares),
      estimated_minutes_watched_pct: pctChange(
        current.estimated_minutes_watched,
        previous.estimated_minutes_watched,
      ),
    },
  });
});

// GET /api/channels/:channelId/analytics/traffic?start_date=&end_date=
route.get("/traffic", async (c) => {
  const channel = c.get("channel");

  const now = new Date();
  const defaultEnd = now.toISOString().slice(0, 10);
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const startDate = c.req.query("start_date") ?? defaultStart;
  const endDate = c.req.query("end_date") ?? defaultEnd;

  const rows = await trafficSources.getByChannelId(
    c.env.DB,
    channel.channel_id,
    startDate,
    endDate,
  );

  return c.json({
    channel_id: channel.channel_id,
    start_date: startDate,
    end_date: endDate,
    count: rows.length,
    data: rows,
  });
});

// GET /api/channels/:channelId/analytics/demographics?type=ageGroup|gender|country|deviceType&start_date=&end_date=
route.get("/demographics", async (c) => {
  const channel = c.get("channel");
  const dimensionType = c.req.query("type");

  const now = new Date();
  const defaultEnd = now.toISOString().slice(0, 10);
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const startDate = c.req.query("start_date") ?? defaultStart;
  const endDate = c.req.query("end_date") ?? defaultEnd;

  // Percentage-based dimensions
  if (dimensionType === "ageGroup" || dimensionType === "gender") {
    const rows = await viewerDemographics.getPctByChannelId(
      c.env.DB,
      channel.channel_id,
      startDate,
      endDate,
      dimensionType,
    );

    return c.json({
      channel_id: channel.channel_id,
      dimension_type: dimensionType,
      start_date: startDate,
      end_date: endDate,
      count: rows.length,
      data: rows,
    });
  }

  // Count-based dimensions
  if (dimensionType === "country" || dimensionType === "deviceType") {
    const rows = await viewerDemographics.getCountsByChannelId(
      c.env.DB,
      channel.channel_id,
      startDate,
      endDate,
      dimensionType,
    );

    return c.json({
      channel_id: channel.channel_id,
      dimension_type: dimensionType,
      start_date: startDate,
      end_date: endDate,
      count: rows.length,
      data: rows,
    });
  }

  // No type or all types — return both pct and counts
  const [pctRows, countRows] = await Promise.all([
    viewerDemographics.getPctByChannelId(c.env.DB, channel.channel_id, startDate, endDate),
    viewerDemographics.getCountsByChannelId(c.env.DB, channel.channel_id, startDate, endDate),
  ]);

  return c.json({
    channel_id: channel.channel_id,
    start_date: startDate,
    end_date: endDate,
    percentages: { count: pctRows.length, data: pctRows },
    counts: { count: countRows.length, data: countRows },
  });
});

// POST /api/channels/:channelId/analytics/sync-all — trigger full analytics sync (daily + traffic + demographics)
route.post("/sync-all", async (c) => {
  const channel = c.get("channel");

  try {
    const [dailyResult, trafficResult, demoResult] = await Promise.all([
      syncAnalytics(c.env, channel),
      syncTrafficSources(c.env, channel),
      syncDemographics(c.env, channel),
    ]);

    return c.json({
      ok: true,
      channel_id: channel.channel_id,
      daily_upserted: dailyResult.upserted,
      traffic_upserted: trafficResult.upserted,
      demographics_pct_upserted: demoResult.upsertedPct,
      demographics_counts_upserted: demoResult.upsertedCounts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: "Full analytics sync failed", details: message }, 502);
  }
});

export default route;
