import { commandContributions, type CommandContribution } from "@/extension/contributions.ts";
import { commandIds, product } from "@/product.ts";
import type { ThemeContribution } from "@/theme/types.ts";

export type ExtensionPackageMetadata = {
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: string;
  license: string;
  repository: {
    type: "git";
    url: string;
    directory?: string;
  };
};

type ExtensionManifest = {
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: string;
  license: string;
  type: "module";
  main: string;
  icon: string;
  activationEvents: string[];
  extensionPack: string[];
  repository: {
    type: "git";
    url: string;
    directory?: string;
  };
  files: string[];
  engines: {
    vscode: string;
  };
  categories: string[];
  keywords: string[];
  contributes: {
    commands: CommandContribution[];
    themes: ThemeContribution[];
  };
};

export const createExtensionManifest = (
  packageMetadata: ExtensionPackageMetadata,
  themes: ThemeContribution[],
): ExtensionManifest => ({
  name: packageMetadata.name,
  displayName: packageMetadata.displayName,
  description: packageMetadata.description,
  version: packageMetadata.version,
  publisher: packageMetadata.publisher,
  license: packageMetadata.license,
  type: "module",
  main: "./extension.js",
  icon: "assets/logo.png",
  activationEvents: [`onCommand:${commandIds.configure}`, "onStartupFinished"],
  extensionPack: [product.recommendedExtensions.symbols.id],
  repository: packageMetadata.repository,
  files: ["extension.js", "assets/**", "themes/**", "README.md", "LICENSE", "package.json"],
  engines: {
    vscode: "^1.100.0",
  },
  categories: ["Themes"],
  keywords: ["theme", "dark theme", "light theme", "black", "umbre"],
  contributes: {
    commands: commandContributions(),
    themes,
  },
});
