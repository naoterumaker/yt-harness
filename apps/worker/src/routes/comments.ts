import { Hono } from "hono";
import { comments, videos } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// POST /api/channels/:channelId/comments/sync — Sync comments from YouTube API
route.post("/sync", async (c) => {
  const channel = c.get("channel");
  const videoList = await videos.listVideos(c.env.DB, channel.channel_id);
  let synced = 0;

  for (const video of videoList) {
    try {
      let pageToken = "";
      do {
        const params = new URLSearchParams({
          part: "snippet",
          videoId: video.video_id,
          maxResults: "100",
          order: "time",
        });
        if (pageToken) params.set("pageToken", pageToken);

        const resp = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?${params}`,
          { headers: { Authorization: `Bearer ${channel.access_token}` } },
        );

        if (!resp.ok) break;

        const data = (await resp.json()) as {
          items: Array<{
            snippet: {
              topLevelComment: {
                id: string;
                snippet: {
                  authorChannelId?: { value: string };
                  authorDisplayName: string;
                  textDisplay: string;
                  likeCount: number;
                  publishedAt: string;
                };
              };
            };
          }>;
          nextPageToken?: string;
        };

        if (!data.items?.length) break;

        for (const item of data.items) {
          const s = item.snippet.topLevelComment.snippet;
          await comments.upsertComment(c.env.DB, {
            video_id: video.video_id,
            comment_id: item.snippet.topLevelComment.id,
            parent_comment_id: null,
            author_channel_id: s.authorChannelId?.value ?? "",
            author_display_name: s.authorDisplayName,
            text: s.textDisplay,
            like_count: s.likeCount,
            is_pinned: false,
            published_at: s.publishedAt,
          });
          synced++;
        }

        pageToken = data.nextPageToken ?? "";
      } while (pageToken);
    } catch {
      // コメント無効の動画はスキップ
    }
  }

  return c.json({ synced, message: `${synced}件のコメントを同期しました` });
});

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
