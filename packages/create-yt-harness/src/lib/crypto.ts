import { randomBytes } from "node:crypto";

export function generateApiKey(): string {
  return `yth_${randomBytes(16).toString("hex")}`;
}

export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}
