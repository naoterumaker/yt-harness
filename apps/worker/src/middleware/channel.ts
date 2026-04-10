import type { Context, Next } from "hono";
import { channels } from "@yt-harness/db";
import type { YtChannel } from "@yt-harness/shared";
import { NotFoundError } from "../errors/index.js";
import type { Env } from "./auth.js";

declare module "hono" {
  interface ContextVariableMap {
    channel: YtChannel;
  }
}

export async function channelMiddleware(
  c: Context<{ Bindings: Env }>,
  next: Next,
) {
  const channelId = c.req.param("channelId");
  if (!channelId) {
    throw new NotFoundError("Channel ID");
  }

  const channel = await channels.getChannel(c.env.DB, Number(channelId));
  if (!channel) {
    throw new NotFoundError("Channel");
  }

  // Auto-refresh token if expired
  if (new Date(channel.token_expires_at) < new Date()) {
    const refreshed = await refreshAccessToken(c, channel);
    if (refreshed) {
      c.set("channel", refreshed);
    } else {
      c.set("channel", channel);
    }
  } else {
    c.set("channel", channel);
  }

  await next();
}

async function refreshAccessToken(
  c: Context<{ Bindings: Env }>,
  channel: YtChannel,
): Promise<YtChannel | null> {
  try {
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

    if (!resp.ok) return null;

    const data = (await resp.json()) as {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
    };

    const expiresAt = new Date(
      Date.now() + data.expires_in * 1000,
    ).toISOString();

    return channels.updateTokens(c.env.DB, channel.id, {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? channel.refresh_token,
      token_expires_at: expiresAt,
    });
  } catch {
    return null;
  }
}
