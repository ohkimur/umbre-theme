import { modes, type Mode } from "@/config.ts";
import { product } from "@/product.ts";
import type { UmbreSettings } from "@/runtime/settings.ts";
import { copyVariantToTheme, readThemeFile, writeThemeFile } from "@/runtime/theme-files.ts";
import { themeModeFromLabel } from "@/theme/naming.ts";
import * as vscode from "vscode";

type PreviewSnapshot = {
  activeMode?: Mode;
  themeFiles: Record<Mode, Uint8Array>;
};

export type ThemePreview = {
  preview(settings: UmbreSettings): void;
  settle(): Promise<void>;
  finish(settings: UmbreSettings): Promise<void>;
  cancel(): Promise<void>;
};

export const createThemePreview = async (): Promise<ThemePreview> => {
  const snapshot = await captureSnapshot();
  let request = 0;
  let queue: Promise<void> = Promise.resolve();
  let lastKey = "";
  let previewErrorShown = false;

  const preview = (settings: UmbreSettings): void => {
    const key = previewKey(snapshot, settings);
    if (key === lastKey) return;
    lastKey = key;
    const currentRequest = ++request;

    queue = queue
      .then(async () => {
        if (currentRequest !== request) return;
        await copyVariantToTheme(settings, previewTargetMode(snapshot, settings));
      })
      .catch(async (error: unknown) => {
        if (previewErrorShown) return;
        previewErrorShown = true;
        const message = error instanceof Error ? error.message : String(error);
        await vscode.window.showErrorMessage(`Unable to preview ${product.displayName} theme: ${message}`);
      });
  };

  const settle = async (): Promise<void> => {
    request += 1;
    await queue.catch(() => undefined);
  };

  const finish = async (settings: UmbreSettings): Promise<void> => {
    await settle();
    await restoreThemeFiles(snapshot, previewTargetMode(snapshot, settings));
  };

  const cancel = async (): Promise<void> => {
    await settle();
    await restoreThemeFiles(snapshot);
  };

  return { preview, settle, finish, cancel };
};

const captureSnapshot = async (): Promise<PreviewSnapshot> => {
  const activeTheme = vscode.workspace.getConfiguration("workbench").get<string>("colorTheme", "");
  const [dark, light] = await Promise.all([readThemeFile("dark"), readThemeFile("light")]);

  const activeMode = themeModeFromLabel(activeTheme);

  return {
    ...(activeMode ? { activeMode } : {}),
    themeFiles: { dark, light },
  };
};

const restoreThemeFiles = async (snapshot: PreviewSnapshot, keepMode?: Mode): Promise<void> => {
  await Promise.all(
    modes.map((mode) => {
      if (mode === keepMode) return Promise.resolve();
      return writeThemeFile(mode, snapshot.themeFiles[mode]);
    }),
  );
};

const previewTargetMode = (snapshot: PreviewSnapshot, settings: UmbreSettings): Mode => {
  return snapshot.activeMode ?? settings.mode;
};

const previewKey = (snapshot: PreviewSnapshot, settings: UmbreSettings): string =>
  [
    previewTargetMode(snapshot, settings),
    settings.mode,
    settings.shade.id,
    settings.accent,
    settings.dim.id,
    settings.panels.id,
    settings.terminal.id,
    settings.borders.id,
  ].join(":");
