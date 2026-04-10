import { Hono } from "hono";
import { staff } from "@yt-harness/db";
import { NotFoundError, ValidationError } from "../errors/index.js";
import type { Env } from "../middleware/auth.js";

const route = new Hono<{ Bindings: Env }>();

// GET /api/staff
route.get("/", async (c) => {
  const list = await staff.listStaff(c.env.DB);
  return c.json({ staff: list });
});

// POST /api/staff
route.post("/", async (c) => {
  const body = await c.req.json<{
    email: string;
    name: string;
    role: "admin" | "editor" | "viewer";
  }>();
  if (!body.email || !body.name || !body.role) {
    throw new ValidationError("email, name, and role are required");
  }

  const member = await staff.upsertStaff(c.env.DB, body);
  return c.json({ staff: member }, 201);
});

// DELETE /api/staff/:id
route.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const deleted = await staff.deleteStaff(c.env.DB, id);
  if (!deleted) throw new NotFoundError("Staff member");
  return c.json({ deleted: true });
});

export default route;
