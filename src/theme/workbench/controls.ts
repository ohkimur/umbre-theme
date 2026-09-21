import { markdownTextColors } from "@/theme/markdown.ts";
import type { ThemeModel } from "@/theme/model.ts";
import { transparent } from "@/theme/palette.ts";
import type { ColorMap } from "@/theme/types.ts";

export const controlColors = ({ accent, surfaces }: ThemeModel): ColorMap => ({
  "button.background": accent.main,
  "button.foreground": accent.on,
  "button.hoverBackground": accent.hover,
  "button.secondaryBackground": surfaces.raised,
  "button.secondaryForeground": surfaces.fg,
  "button.secondaryHoverBackground": surfaces.overlay2,
  "button.border": transparent(),
  "badge.background": accent.main,
  "badge.foreground": accent.on,
  "progressBar.background": accent.main,
  "checkbox.background": surfaces.chrome1,
  "checkbox.foreground": surfaces.fg,
  "checkbox.border": surfaces.lineStrong,
  "checkbox.selectBackground": surfaces.chrome1,
  "checkbox.selectBorder": accent.border,
});

export const textColors = (model: ThemeModel): ColorMap => markdownTextColors(model);
