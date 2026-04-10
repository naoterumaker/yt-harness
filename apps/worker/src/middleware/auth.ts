import type { Context, Next } from "hono";
import { settings } from "@yt-harness/db";
import { AuthError } from "../errors/index.js";

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header");
  }

  const token = header.slice(7);
  const apiKey = await settings.getSetting(c.env.DB, "API_KEY");

  if (!apiKey || token !== apiKey) {
    throw new AuthError("Invalid API key");
  }

  await next();
}

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  ENCRYPTION_KEY: string;
}
