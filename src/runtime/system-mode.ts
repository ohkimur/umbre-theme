import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { Mode } from "@/config.ts";

const execFileAsync = promisify(execFile);

export const detectSystemMode = async (): Promise<Mode | undefined> => {
  if (process.platform === "darwin") return detectMacosMode();
  if (process.platform === "win32") return detectWindowsMode();
  return undefined;
};

const detectMacosMode = async (): Promise<Mode> => {
  try {
    const { stdout } = await execFileAsync("defaults", ["read", "-g", "AppleInterfaceStyle"]);
    return stdout.trim() === "Dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

const detectWindowsMode = async (): Promise<Mode | undefined> => {
  try {
    const { stdout } = await execFileAsync("reg", [
      "query",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
      "/v",
      "AppsUseLightTheme",
    ]);
    return /AppsUseLightTheme\s+REG_DWORD\s+0x0/i.test(stdout) ? "dark" : "light";
  } catch {
    return undefined;
  }
};
