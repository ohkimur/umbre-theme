import { readFileSync } from "node:fs";

const isDryRun = process.argv.includes("--dry-run") || process.argv.includes("-d");
const packageJson = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf8"));
const vsixFile = `${packageJson.name}.vsix`;

/** @type {import('semantic-release').GlobalConfig} */
export default {
  branches: ["main"],
  tagFormat: "v${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        linkCompare: false,
      },
    ],
    [
      "@semantic-release/exec",
      {
        ...(isDryRun ? {} : { verifyConditionsCmd: "bun scripts/release/verify-marketplaces.ts" }),
        prepareCmd:
          "git tag -d v0.0.0 >/dev/null 2>&1 || true; UMBRE_VERSION=${nextRelease.version} bun run build && bun run package",
        publishCmd: "bun scripts/release/publish-marketplaces.ts",
      },
    ],
    ...(isDryRun
      ? []
      : [
          [
            "@semantic-release/github",
            {
              assets: [
                {
                  path: vsixFile,
                  label: "VS Code theme package",
                },
              ],
              successCommentCondition: false,
              failCommentCondition: false,
            },
          ],
        ]),
  ],
};
