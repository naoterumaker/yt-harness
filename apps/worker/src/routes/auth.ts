import { Hono } from "hono";
import { channels } from "@yt-harness/db";
import { ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

const route = new Hono<{ Bindings: Env }>();

// GET /api/auth/url — Generate OAuth URL
route.get("/url", (c) => {
  const adminUrl = c.req.query("redirect") || "http://localhost:3000";
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: adminUrl,
  });

  return c.json({
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
});

// GET /api/auth/callback — Handle OAuth callback
route.get("/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    throw new ValidationError("Missing authorization code");
  }

  // Exchange code for tokens
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResp.ok) {
    const err = await tokenResp.text();
    throw new ValidationError(`Token exchange failed: ${err}`);
  }

  const tokens = (await tokenResp.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // Fetch channel info
  const channelResp = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );

  if (!channelResp.ok) {
    throw new ValidationError("Failed to fetch channel info");
  }

  const channelData = (await channelResp.json()) as {
    items: Array<{
      id: string;
      snippet: { title: string; thumbnails: { default: { url: string } } };
    }>;
  };

  if (!channelData.items?.length) {
    throw new ValidationError("No YouTube channel found");
  }

  const item = channelData.items[0];
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();

  const channel = await channels.upsertChannel(c.env.DB, {
    channel_id: item.id,
    channel_title: item.snippet.title,
    channel_thumbnail: item.snippet.thumbnails.default.url,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: expiresAt,
    daily_quota_limit: 10000,
    quota_alert_threshold: 500,
  });

  // Admin UI にリダイレクト（クエリパラメータで成功を通知）
  const adminUrl = c.req.query("state") || "http://localhost:3000";
  return c.redirect(`${adminUrl}/settings?added=${item.snippet.title}`);
});

// POST /api/auth/refresh — Manual token refresh
route.post("/refresh", async (c) => {
  const body = await c.req.json<{ channel_id: number }>();
  if (!body.channel_id) {
    throw new ValidationError("channel_id is required");
  }

  const channel = await channels.getChannel(c.env.DB, body.channel_id);
  if (!channel) {
    throw new ValidationError("Channel not found");
  }

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      refresh_token: channel.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!resp.ok) {
    throw new ValidationError("Token refresh failed");
  }

  const data = (await resp.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  const expiresAt = new Date(
    Date.now() + data.expires_in * 1000,
  ).toISOString();

  const updated = await channels.updateTokens(c.env.DB, channel.id, {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? channel.refresh_token,
    token_expires_at: expiresAt,
  });

  return c.json({ channel: updated });
});

export default route;
