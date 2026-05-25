import type { ThemeModel } from "@/theme/model.ts";
import type { ColorMap } from "@/theme/types.ts";

export const settingsColors = ({ accent, surfaces }: ThemeModel): ColorMap => ({
  "settings.headerForeground": surfaces.fg,
  "settings.modifiedItemIndicator": accent.main,
  "settings.dropdownBackground": surfaces.chrome1,
  "settings.dropdownForeground": surfaces.fg,
  "settings.dropdownBorder": surfaces.lineStrong,
  "settings.checkboxBackground": surfaces.chrome1,
  "settings.checkboxForeground": surfaces.fg,
  "settings.checkboxBorder": surfaces.lineStrong,
  "settings.textInputBackground": surfaces.chrome1,
  "settings.textInputForeground": surfaces.fg,
  "settings.textInputBorder": surfaces.lineStrong,
  "settings.numberInputBackground": surfaces.chrome1,
  "settings.numberInputForeground": surfaces.fg,
  "settings.numberInputBorder": surfaces.lineStrong,
  "settings.focusedRowBackground": surfaces.overlay,
  "settings.rowHoverBackground": surfaces.chrome3,
});
