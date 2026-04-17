import { Hono } from "hono";
import { videos } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// POST /api/channels/:channelId/videos/sync — Sync videos from YouTube API
route.post("/sync", async (c) => {
  const channel = c.get("channel");
  let pageToken = "";
  let synced = 0;

  do {
    const params = new URLSearchParams({
      part: "snippet,statistics,status",
      channelId: channel.channel_id,
      maxResults: "50",
      type: "video",
    });
    if (pageToken) params.set("pageToken", pageToken);

    // First get video IDs via search
    const searchParams = new URLSearchParams({
      part: "id",
      forMine: "true",
      maxResults: "50",
      order: "date",
      type: "video",
    });
    if (pageToken) searchParams.set("pageToken", pageToken);

    const searchResp = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchParams}`,
      { headers: { Authorization: `Bearer ${channel.access_token}` } },
    );

    if (!searchResp.ok) {
      const err = await searchResp.text();
      return c.json({ error: `YouTube API error: ${err}` }, 500);
    }

    const searchData = (await searchResp.json()) as {
      items: Array<{ id: { videoId: string } }>;
      nextPageToken?: string;
    };

    if (!searchData.items?.length) break;

    const videoIds = searchData.items.map((i) => i.id.videoId).join(",");

    // Get full video details
    const detailResp = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${channel.access_token}` } },
    );

    if (!detailResp.ok) break;

    const detailData = (await detailResp.json()) as {
      items: Array<{
        id: string;
        snippet: {
          title: string;
          description: string;
          publishedAt: string;
          thumbnails: { high?: { url: string }; default?: { url: string } };
        };
        statistics: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
        status: { privacyStatus: string };
      }>;
    };

    for (const item of detailData.items) {
      await videos.upsertVideo(c.env.DB, {
        channel_id: channel.channel_id,
        video_id: item.id,
        title: item.snippet.title,
        description: item.snippet.description.slice(0, 1000),
        status: item.status.privacyStatus as "public" | "private" | "unlisted",
        published_at: item.snippet.publishedAt,
        scheduled_at: null,
        thumbnail_url:
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.default?.url ??
          null,
        view_count: Number(item.statistics.viewCount ?? 0),
        like_count: Number(item.statistics.likeCount ?? 0),
        comment_count: Number(item.statistics.commentCount ?? 0),
      });
      synced++;
    }

    pageToken = searchData.nextPageToken ?? "";
  } while (pageToken);

  return c.json({ synced, message: `${synced}本の動画を同期しました` });
});

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
