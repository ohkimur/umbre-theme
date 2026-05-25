import { readFile } from "node:fs/promises";

import { createExtensionManifest, type ExtensionPackageMetadata } from "@/extension/manifest.ts";
import { product } from "@/product.ts";
import { copyFile, ensureDir, remove } from "@/utils/fs.ts";
import { writeJson } from "@/utils/json.ts";
import { bundleRuntime } from "@scripts/build/bundle-runtime.ts";
import {
  distAssetsDir,
  distDir,
  licensePath,
  rootDir,
  logoPath,
  logoSourcePath,
  readmePath,
  themesDir,
} from "@scripts/build/paths.ts";
import { createThemes, type BuiltThemeFile } from "@scripts/build/themes.ts";

export const buildExtension = async (): Promise<void> => {
  const themes = createThemes();
  const packageMetadata = await readPackageMetadata();

  await resetDist();
  await bundleRuntime();
  await writeThemeFiles(themes, themesDir);
  await copyFile(logoPath, new URL("logo.png", distAssetsDir));
  await copyFile(logoSourcePath, new URL("logo.svg", distAssetsDir));
  await writeJson(
    new URL("package.json", distDir),
    createExtensionManifest(
      packageMetadata,
      themes.map((theme) => theme.contribution),
    ),
  );
  await copyFile(readmePath, new URL("README.md", distDir));
  await copyFile(licensePath, new URL("LICENSE", distDir));

  console.log(`Built ${themes.length} ${product.displayName} themes in ${distDir.pathname}`);
};

const readPackageMetadata = async (): Promise<ExtensionPackageMetadata> => {
  const packageJson = JSON.parse(
    await readFile(new URL("package.json", rootDir), "utf8"),
  ) as Partial<ExtensionPackageMetadata>;

  return {
    name: readStringField(packageJson, "name"),
    displayName: readStringField(packageJson, "displayName"),
    description: readStringField(packageJson, "description"),
    version: process.env.UMBRE_VERSION ?? readStringField(packageJson, "version"),
    publisher: readStringField(packageJson, "publisher"),
    license: readStringField(packageJson, "license"),
    repository: readRepository(packageJson.repository),
  };
};

const readStringField = (
  packageJson: Partial<ExtensionPackageMetadata>,
  field: keyof ExtensionPackageMetadata,
): string => {
  const value = packageJson[field];
  if (typeof value !== "string") {
    throw new Error(`package.json must define a string ${field} field.`);
  }
  return value;
};

const readRepository = (value: unknown): ExtensionPackageMetadata["repository"] => {
  if (!value || typeof value !== "object") {
    throw new Error("package.json must define a repository object.");
  }

  const repository = value as Partial<ExtensionPackageMetadata["repository"]>;
  if (repository.type !== "git" || typeof repository.url !== "string") {
    throw new Error('package.json repository must define type "git" and a url.');
  }

  return typeof repository.directory === "string"
    ? { type: repository.type, url: repository.url, directory: repository.directory }
    : { type: repository.type, url: repository.url };
};

const resetDist = async (): Promise<void> => {
  await remove(distDir);
  await ensureDir(themesDir);
  await ensureDir(distAssetsDir);
};

const writeThemeFiles = async (themes: readonly BuiltThemeFile[], directory: URL): Promise<void> => {
  await Promise.all(
    themes.map((theme) => {
      return writeJson(new URL(theme.fileName, directory), theme.document);
    }),
  );
};
