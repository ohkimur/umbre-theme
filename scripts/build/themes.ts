import { defaultMode } from "@/config.ts";
import { createTheme } from "@/theme/create-theme.ts";
import type { BuiltTheme, ThemeDocument } from "@/theme/types.ts";

export type BuiltThemeFile = {
  document: ThemeDocument;
  fileName: string;
};

export const createThemes = (): BuiltTheme[] => [createTheme(defaultMode)];
