import { product } from "@/product.ts";
import * as vscode from "vscode";

const installAction = `Install ${product.recommendedExtensions.symbols.name}`;
const chooseAction = "Choose Icon Theme";
const dismissAction = "Not now";

export const suggestSymbolsIconTheme = (context: vscode.ExtensionContext): void => {
  setTimeout(() => void suggestSymbolsIconThemeNow(context), 1500);
};

const suggestSymbolsIconThemeNow = async (context: vscode.ExtensionContext): Promise<void> => {
  if (context.globalState.get<boolean>(product.recommendedExtensions.symbols.promptStorageKey)) return;
  if (activeIconTheme() === product.recommendedExtensions.symbols.iconThemeId) return;

  if (!isSymbolsInstalled()) {
    await suggestInstall(context);
    return;
  }

  await suggestChooseIconTheme(context);
};

const suggestInstall = async (context: vscode.ExtensionContext): Promise<void> => {
  const symbols = product.recommendedExtensions.symbols;
  const choice = await vscode.window.showInformationMessage(
    `${product.displayName} pairs well with ${symbols.name}, a simple file icon theme.`,
    { modal: true },
    installAction,
    dismissAction,
  );

  if (choice === installAction) {
    await vscode.commands.executeCommand("workbench.extensions.installExtension", symbols.id, {
      justification: {
        reason: `${product.displayName} recommends ${symbols.name} as a matching file icon theme.`,
        action: installAction,
      },
    });
    await suggestChooseIconTheme(context);
    return;
  }

  if (choice === dismissAction) await dismissPrompt(context);
};

const suggestChooseIconTheme = async (context: vscode.ExtensionContext): Promise<void> => {
  const symbols = product.recommendedExtensions.symbols;
  const choice = await vscode.window.showInformationMessage(
    `${symbols.name} is installed. Choose it as your file icon theme?`,
    { modal: true },
    chooseAction,
    dismissAction,
  );

  if (choice === chooseAction) {
    await dismissPrompt(context);
    await vscode.commands.executeCommand("workbench.action.selectIconTheme");
    return;
  }

  if (choice === dismissAction) await dismissPrompt(context);
};

const dismissPrompt = async (context: vscode.ExtensionContext): Promise<void> => {
  await context.globalState.update(product.recommendedExtensions.symbols.promptStorageKey, true);
};

const isSymbolsInstalled = (): boolean => {
  return vscode.extensions.getExtension(product.recommendedExtensions.symbols.id) !== undefined;
};

const activeIconTheme = (): string => {
  return vscode.workspace.getConfiguration("workbench").get<string>("iconTheme", "");
};
