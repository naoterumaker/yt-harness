import type { Context, Next } from "hono";
import { quotaUsage, channels } from "@yt-harness/db";
import { QuotaExceededError } from "../errors/index.js";
import type { Env } from "./auth.js";

const QUOTA_THRESHOLD = 500;

const SKIP_PATHS = ["/api/health", "/api/setup", "/api/auth"];

export async function quotaGuard(c: Context<{ Bindings: Env }>, next: Next) {
  const path = new URL(c.req.url).pathname;

  if (SKIP_PATHS.some((p) => path.startsWith(p))) {
    return next();
  }

  // Try to extract channelId from route or query
  const channelId =
    c.req.param("channelId") ?? c.req.query("channelId");

  if (!channelId) {
    return next();
  }

  const channel = await channels.getChannel(c.env.DB, Number(channelId));
  if (!channel) {
    return next();
  }

  const dailyTotal = await quotaUsage.getDailyTotal(
    c.env.DB,
    channel.channel_id,
  );
  const remaining = channel.daily_quota_limit - dailyTotal;

  if (remaining < QUOTA_THRESHOLD) {
    throw new QuotaExceededError(
      `Quota below threshold: ${remaining} units remaining (threshold: ${QUOTA_THRESHOLD})`,
    );
  }

  await next();
}
