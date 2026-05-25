import type { AccentFamily, BorderVariant, DimVariant, Mode, ShadeVariant } from "@/config.ts";
import { titleCase } from "@/utils/text.ts";

export const themeLabel = (mode: Mode): string => `Umbra ${titleCase(mode)}`;

export const themeFileName = (mode: Mode): string => `umbra-${mode}-color-theme.json`;

export const variantFileName = (
  mode: Mode,
  shade: ShadeVariant,
  accent: AccentFamily,
  dim: DimVariant,
  borders: BorderVariant,
): string => {
  return `umbra-${variantKey(mode, shade, accent, dim, borders)}-color-theme.json`;
};

export const variantKey = (
  mode: Mode,
  shade: ShadeVariant,
  accent: AccentFamily,
  dim: DimVariant,
  borders: BorderVariant,
): string => `${mode}-s${shade.id}-${accent}-d${dim.id}-b${borders.id}`;

export const themeModeFromLabel = (label: string): Mode | undefined => {
  if (label === themeLabel("dark")) return "dark";
  if (label === themeLabel("light")) return "light";
  return undefined;
};
