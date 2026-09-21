import { product } from "@/product.ts";
import { recommendExtension } from "@/runtime/extension-recommendation.ts";
import * as vscode from "vscode";

const useAction = `Use ${product.recommendedExtensions.symbols.name}`;
const dismissAction = "Not now";

let dismissedThisSession = false;

export const suggestSymbolsIconTheme = async (context: vscode.ExtensionContext): Promise<void> => {
  const symbols = product.recommendedExtensions.symbols;
  // The setting can name Symbols after the extension was removed or disabled, so check both.
  if (activeIconTheme() === symbols.iconThemeId && vscode.extensions.getExtension(symbols.id)) return;
  if (dismissedThisSession) return;

  const outcome = await recommendExtension(context, symbols);
  if (outcome !== "declined" && activeIconTheme() !== symbols.iconThemeId) await suggestUseIconTheme();
};

const suggestUseIconTheme = async (): Promise<void> => {
  const symbols = product.recommendedExtensions.symbols;
  const choice = await vscode.window.showInformationMessage(
    `${symbols.name} is ready. Use it as your file icon theme?`,
    useAction,
    dismissAction,
  );

  if (choice === useAction) {
    await setIconTheme(symbols.iconThemeId);
    return;
  }

  dismissPromptForSession();
};

const dismissPromptForSession = (): void => {
  dismissedThisSession = true;
};

const setIconTheme = async (iconThemeId: string): Promise<void> => {
  await vscode.workspace
    .getConfiguration("workbench")
    .update("iconTheme", iconThemeId, vscode.ConfigurationTarget.Global);
};

const activeIconTheme = (): string => {
  return vscode.workspace.getConfiguration("workbench").get<string>("iconTheme", "");
};

export const resetSymbolsIconThemePromptForTests = (): void => {
  dismissedThisSession = false;
};
