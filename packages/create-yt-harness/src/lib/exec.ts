import { execSync, spawnSync } from "node:child_process";

export interface ExecResult {
  success: boolean;
  stdout: string;
  stderr: string;
  status: number | null;
}

export function exec(cmd: string, opts?: { cwd?: string; silent?: boolean }): ExecResult {
  try {
    const stdout = execSync(cmd, {
      cwd: opts?.cwd,
      encoding: "utf-8",
      stdio: opts?.silent ? ["pipe", "pipe", "pipe"] : ["pipe", "pipe", "inherit"],
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    return { success: true, stdout: stdout.trim(), stderr: "", status: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return {
      success: false,
      stdout: (err.stdout as string || "").trim(),
      stderr: (err.stderr as string || "").trim(),
      status: err.status ?? 1,
    };
  }
}

export function execLive(cmd: string, opts?: { cwd?: string }): boolean {
  const result = spawnSync(cmd, {
    cwd: opts?.cwd,
    shell: true,
    stdio: "inherit",
    env: { ...process.env },
  });
  return result.status === 0;
}

export function commandExists(cmd: string): boolean {
  const result = exec(`which ${cmd}`, { silent: true });
  return result.success;
}
