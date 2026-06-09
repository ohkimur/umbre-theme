import type { Mode } from "@/config.ts";
import { isThemeLabel, themeModeFromLabel } from "@/theme/naming.ts";
import * as vscode from "vscode";

const themeConfigurationKeys = [
  "workbench.colorTheme",
  "workbench.preferredDarkColorTheme",
  "workbench.preferredLightColorTheme",
  "window.autoDetectColorScheme",
] as const;

type WorkbenchThemeLabels = {
  colorTheme: string;
  preferredDark: string;
  preferredLight: string;
};

export const isUmbreThemeConfigured = (): boolean =>
  Object.values(workbenchThemeLabels()).some((label) => isThemeLabel(label));

export const isUmbreThemeActive = (): boolean => {
  const labels = workbenchThemeLabels();
  if (isThemeLabel(labels.colorTheme)) return true;
  if (!autoDetectColorScheme()) return false;

  const preferredTheme = preferredThemeForActiveKind(labels);
  return preferredTheme !== undefined && isThemeLabel(preferredTheme);
};

export const configuredUmbreThemeMode = (): Mode | undefined => {
  const labels = workbenchThemeLabels();
  return (
    themeModeFromLabel(labels.colorTheme) ??
    (isThemeLabel(labels.preferredDark) ? "dark" : undefined) ??
    (isThemeLabel(labels.preferredLight) ? "light" : undefined)
  );
};

export const affectsUmbreThemeConfiguration = (event: vscode.ConfigurationChangeEvent): boolean =>
  themeConfigurationKeys.some((key) => event.affectsConfiguration(key));

const workbenchThemeLabels = (): WorkbenchThemeLabels => {
  const workbench = vscode.workspace.getConfiguration("workbench");
  return {
    colorTheme: workbench.get<string>("colorTheme", ""),
    preferredDark: workbench.get<string>("preferredDarkColorTheme", ""),
    preferredLight: workbench.get<string>("preferredLightColorTheme", ""),
  };
};

const preferredThemeForActiveKind = (labels: WorkbenchThemeLabels): string | undefined => {
  const activeKind = vscode.window.activeColorTheme.kind;
  if (activeKind === vscode.ColorThemeKind.Dark) return labels.preferredDark;
  if (activeKind === vscode.ColorThemeKind.Light) return labels.preferredLight;
  return undefined;
};

const autoDetectColorScheme = (): boolean => {
  return vscode.workspace.getConfiguration("window").get<boolean>("autoDetectColorScheme", false);
};
