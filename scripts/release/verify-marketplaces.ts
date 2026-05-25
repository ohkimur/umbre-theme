import { readFile } from "node:fs/promises";

import { runCommand } from "@/utils/process.ts";
import { rootDir } from "@scripts/build/paths.ts";

const packageJson = JSON.parse(await readFile(new URL("package.json", rootDir), "utf8")) as {
  publisher?: unknown;
};

const requireEnv = (name: string, service: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add a GitHub Actions secret for ${service} publishing.`);
  }
  return value;
};

const requireString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
};

const publisher = requireString(packageJson.publisher, "package.json publisher");
const vscePat = requireEnv("VSCE_PAT", "Visual Studio Marketplace");
requireEnv("OVSX_PAT", "Open VSX");

await runCommand("bun", ["x", "vsce", "verify-pat", publisher, "-p", vscePat]);
await runCommand("bun", ["x", "ovsx", "verify-pat", publisher]);
