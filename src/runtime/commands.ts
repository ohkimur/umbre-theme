import { commandIds, product } from "@/product.ts";
import { applySettings } from "@/runtime/apply.ts";
import { pickSettings } from "@/runtime/picker.ts";
import { createThemePreview } from "@/runtime/preview.ts";
import { readSettings, updateSettings, type UmbreSettings } from "@/runtime/settings.ts";
import { themeModeFromLabel } from "@/theme/naming.ts";
import * as vscode from "vscode";

export const registerCommands = (context: vscode.ExtensionContext): void => {
  context.subscriptions.push(vscode.commands.registerCommand(commandIds.configure, configureTheme));
};

const configureTheme = async (): Promise<void> => {
  const activeMode = currentColorThemeMode();
  const preview = await createThemePreview();
  let picked: UmbreSettings | undefined;
  let previewFinished = false;

  try {
    picked = await pickSettings(readSettings(), preview.preview);
    if (!picked) return;

    await preview.finish(picked);
    previewFinished = true;
  } finally {
    if (!previewFinished) await preview.cancel();
  }

  await updateSettings(picked);
  const label = await applySettings(picked);
  await showAppliedMessage(label, activeMode, picked.mode);
};

const currentColorThemeMode = () => {
  const theme = vscode.workspace.getConfiguration("workbench").get<string>("colorTheme", "");
  return themeModeFromLabel(theme);
};

const showAppliedMessage = async (
  label: string,
  activeMode: UmbreSettings["mode"] | undefined,
  appliedMode: UmbreSettings["mode"],
): Promise<void> => {
  if (activeMode === appliedMode) {
    await vscode.window.showInformationMessage(`${product.displayName} theme applied: ${label}`);
    return;
  }

  await vscode.window.showInformationMessage(
    `${product.displayName} configured: ${label}. Select ${label} in Preferences: Color Theme to switch modes.`,
  );
};
