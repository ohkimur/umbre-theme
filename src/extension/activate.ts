import { commandIds } from "@/product.ts";
import { initializeAppearanceSync } from "@/runtime/appearance-sync.ts";
import { initializeThemeApplication } from "@/runtime/apply.ts";
import { registerCommands } from "@/runtime/commands.ts";
import { initializeRecommendedFonts } from "@/runtime/fonts.ts";
import { extendMarkdownIt, initializeMarkdownPreview } from "@/runtime/markdown-preview.ts";
import { initializeSettings } from "@/runtime/settings.ts";
import * as vscode from "vscode";

export const activate = (context: vscode.ExtensionContext): { extendMarkdownIt: typeof extendMarkdownIt } => {
  initializeSettings(context);
  initializeThemeApplication(context);
  initializeRecommendedFonts(context);
  initializeMarkdownPreview(context);
  registerCommands(context);
  initializeAppearanceSync(context, {
    onThemeSelected: () => vscode.commands.executeCommand(commandIds.configure, { target: "firstRun" }),
  });

  return { extendMarkdownIt };
};

export const deactivate = (): void => undefined;
