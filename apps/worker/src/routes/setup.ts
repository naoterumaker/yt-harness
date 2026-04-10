import { Hono } from "hono";
import { settings, staff } from "@yt-harness/db";
import { ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

route.post("/", async (c) => {
  const existing = await settings.getSetting(c.env.DB, "API_KEY");
  if (existing) {
    throw new ValidationError("Setup already completed");
  }

  const body = await c.req.json<{ admin_email: string; admin_name?: string }>();
  if (!body.admin_email) {
    throw new ValidationError("admin_email is required");
  }

  // Generate API key
  const apiKey = crypto.randomUUID() + "-" + crypto.randomUUID();
  await settings.setSetting(c.env.DB, "API_KEY", apiKey);
  await settings.setSetting(c.env.DB, "ADMIN_EMAIL", body.admin_email);

  // Create admin staff member
  await staff.upsertStaff(c.env.DB, {
    email: body.admin_email,
    name: body.admin_name ?? body.admin_email.split("@")[0],
    role: "admin",
  });

  return c.json({ api_key: apiKey, message: "Setup complete" }, 201);
});

export default route;
