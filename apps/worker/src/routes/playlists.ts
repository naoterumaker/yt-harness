import { Hono } from "hono";
import { playlists } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/channels/:channelId/playlists
route.get("/", async (c) => {
  const channel = c.get("channel");
  const list = await playlists.listPlaylists(c.env.DB, channel.channel_id);
  return c.json({ playlists: list });
});

// GET /api/channels/:channelId/playlists/:id
route.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const playlist = await playlists.getPlaylist(c.env.DB, id);
  if (!playlist) throw new NotFoundError("Playlist");
  return c.json({ playlist });
});

// POST /api/channels/:channelId/playlists
route.post("/", async (c) => {
  const channel = c.get("channel");
  const body = await c.req.json();
  const playlist = await playlists.upsertPlaylist(c.env.DB, {
    channel_id: channel.channel_id,
    ...body,
  });
  return c.json({ playlist }, 201);
});

// DELETE /api/channels/:channelId/playlists/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await playlists.deletePlaylist(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Playlist");
  return c.json({ deleted: true });
});

// POST /api/channels/:channelId/playlists/:id/videos — Add video to playlist (YouTube API)
route.post("/:id/videos", async (c) => {
  const id = Number(c.req.param("id"));
  const channel = c.get("channel");
  const playlist = await playlists.getPlaylist(c.env.DB, id);
  if (!playlist) throw new NotFoundError("Playlist");

  const body = await c.req.json<{ video_id: string }>();
  if (!body.video_id) throw new ValidationError("video_id is required");

  // Call YouTube API to add video to playlist
  const resp = await fetch(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channel.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          playlistId: playlist.playlist_id,
          resourceId: {
            kind: "youtube#video",
            videoId: body.video_id,
          },
        },
      }),
    },
  );

  if (!resp.ok) {
    const err = await resp.text();
    return c.json({ error: "YouTube API error", details: err }, 502);
  }

  const data = await resp.json();
  return c.json({ playlistItem: data }, 201);
});

export default route;
