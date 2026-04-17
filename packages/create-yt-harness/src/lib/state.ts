import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";

export interface SetupState {
  step: string;
  projectName: string;
  googleClientId: string;
  googleClientSecret: string;
  databaseId: string;
  databaseName: string;
  workerUrl: string;
  apiKey: string;
  encryptionKey: string;
  googleRedirectUri: string;
  pagesUrl: string;
}

const STATE_PATH = resolve(homedir(), ".yt-harness-setup.json");

export function loadState(): Partial<SetupState> {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

export function saveState(state: Partial<SetupState>): void {
  const current = loadState();
  const merged = { ...current, ...state };
  writeFileSync(STATE_PATH, JSON.stringify(merged, null, 2), "utf-8");
}

export function clearState(): void {
  if (existsSync(STATE_PATH)) {
    writeFileSync(STATE_PATH, "{}", "utf-8");
  }
}

export function getStatePath(): string {
  return STATE_PATH;
}
