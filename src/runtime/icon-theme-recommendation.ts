import { product } from "@/product.ts";
import * as vscode from "vscode";

const installAction = `Install ${product.recommendedExtensions.symbols.name}`;
const useAction = `Use ${product.recommendedExtensions.symbols.name}`;
const dismissAction = "Not now";
const message = `${product.displayName} pairs well with ${product.recommendedExtensions.symbols.name}, a simple file icon theme.`;

let dismissedThisSession = false;

export const suggestSymbolsIconTheme = async (): Promise<void> => {
  if (activeIconTheme() === product.recommendedExtensions.symbols.iconThemeId) return;
  if (dismissedThisSession) return;

  if (!isSymbolsInstalled()) {
    await suggestInstall();
    return;
  }

  await suggestUseIconTheme();
};

const suggestInstall = async (): Promise<void> => {
  const symbols = product.recommendedExtensions.symbols;
  const choice = await vscode.window.showInformationMessage(message, installAction, dismissAction);

  if (choice === installAction) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Installing ${symbols.name}...`,
      },
      () => vscode.commands.executeCommand("workbench.extensions.installExtension", symbols.id),
    );
    await suggestUseIconTheme();
    return;
  }

  if (choice === dismissAction) dismissPromptForSession();
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

  if (choice === dismissAction) dismissPromptForSession();
};

const dismissPromptForSession = (): void => {
  dismissedThisSession = true;
};

const setIconTheme = async (iconThemeId: string): Promise<void> => {
  await vscode.workspace
    .getConfiguration("workbench")
    .update("iconTheme", iconThemeId, vscode.ConfigurationTarget.Global);
};

const isSymbolsInstalled = (): boolean => {
  return vscode.extensions.getExtension(product.recommendedExtensions.symbols.id) !== undefined;
};

const activeIconTheme = (): string => {
  return vscode.workspace.getConfiguration("workbench").get<string>("iconTheme", "");
};

export const resetSymbolsIconThemePromptForTests = (): void => {
  dismissedThisSession = false;
};
