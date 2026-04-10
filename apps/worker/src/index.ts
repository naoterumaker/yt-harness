import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppError } from "./errors/index.js";
import { authMiddleware, type Env } from "./middleware/auth.js";
import { quotaGuard } from "./middleware/quota-guard.js";
import { channelMiddleware } from "./middleware/channel.js";
import { handleCron } from "./cron/index.js";

// Routes
import healthRoute from "./routes/health.js";
import setupRoute from "./routes/setup.js";
import authRoute from "./routes/auth.js";
import ytChannelsRoute from "./routes/yt-channels.js";
import videosRoute from "./routes/videos.js";
import commentsRoute from "./routes/comments.js";
import commentGatesRoute from "./routes/comment-gates.js";
import subscribersRoute from "./routes/subscribers.js";
import commentSequencesRoute from "./routes/comment-sequences.js";
import playlistsRoute from "./routes/playlists.js";
import analyticsRoute from "./routes/analytics.js";
import usageRoute from "./routes/usage.js";
import tagsRoute from "./routes/tags.js";
import staffRoute from "./routes/staff.js";
import campaignsRoute from "./routes/campaigns.js";

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use("*", cors());

// Error handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message, code: err.code }, err.statusCode as any);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

// Public routes (no auth)
app.route("/api/health", healthRoute);
app.route("/api/setup", setupRoute);
app.route("/api/auth", authRoute);

// Auth + quota guard for all other API routes
app.use("/api/*", authMiddleware);
app.use("/api/*", quotaGuard);

// Top-level routes
app.route("/api/channels", ytChannelsRoute);
app.route("/api/staff", staffRoute);

// Channel-scoped routes (with channel middleware)
const channelScoped = new Hono<{ Bindings: Env }>();
channelScoped.use("*", channelMiddleware);
channelScoped.route("/videos", videosRoute);
channelScoped.route("/comments", commentsRoute);
channelScoped.route("/gates", commentGatesRoute);
channelScoped.route("/subscribers", subscribersRoute);
channelScoped.route("/sequences", commentSequencesRoute);
channelScoped.route("/playlists", playlistsRoute);
channelScoped.route("/analytics", analyticsRoute);
channelScoped.route("/usage", usageRoute);
channelScoped.route("/tags", tagsRoute);
channelScoped.route("/campaigns", campaignsRoute);

app.route("/api/channels/:channelId", channelScoped);

export default {
  fetch: app.fetch,
  scheduled: async (
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    ctx.waitUntil(handleCron(env));
  },
};
