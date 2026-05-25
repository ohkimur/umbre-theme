import type { TokenColor } from "@/theme/types.ts";

export const tokenRule = (
  name: string,
  scope: string[],
  foreground?: string,
  fontStyle?: string,
): TokenColor => {
  const settings: TokenColor["settings"] = {};
  if (foreground) settings.foreground = foreground;
  if (fontStyle) settings.fontStyle = fontStyle;
  return { name, scope, settings };
};
