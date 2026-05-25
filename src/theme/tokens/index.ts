import type { ThemeModel } from "@/theme/model.ts";
import { codeTokenColors } from "@/theme/tokens/code.ts";
import { coreTokenColors } from "@/theme/tokens/core.ts";
import { markupTokenColors } from "@/theme/tokens/markup.ts";
import type { TokenColor } from "@/theme/types.ts";

export const tokenColors = (model: ThemeModel): TokenColor[] => [
  ...coreTokenColors(model),
  ...codeTokenColors(model),
  ...markupTokenColors(model),
];
