import type { ToolDefinition } from "../types.js";

export const staffTools: ToolDefinition[] = [
  {
    name: "list_staff",
    description:
      "スタッフメンバー一覧を取得します。\nList all staff members.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async (client) => {
      return client.get("/api/staff");
    },
  },
  {
    name: "update_staff",
    description:
      "スタッフメンバーを作成・更新します。\nCreate or update a staff member.",
    inputSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "メールアドレス / Email address",
        },
        name: {
          type: "string",
          description: "名前 / Name",
        },
        role: {
          type: "string",
          enum: ["admin", "editor", "viewer"],
          description: "権限ロール / Role (admin, editor, viewer)",
        },
      },
      required: ["email", "name", "role"],
    },
    execute: async (client, args) => {
      return client.post("/api/staff", args);
    },
  },
];
