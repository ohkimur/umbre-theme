import type { ThemeModel } from "@/theme/model.ts";
import { withAlpha } from "@/theme/palette.ts";
import { tokenRule } from "@/theme/token-rule.ts";
import type { TokenColor } from "@/theme/types.ts";

export const markupTokenColors = ({ surfaces, syntax }: ThemeModel): TokenColor[] => [
  tokenRule(
    "Search Result Line Numbers",
    ["constant.numeric.line-number.find-in-files - match"],
    syntax.comment,
  ),
  tokenRule("Search Result Matches", ["constant.numeric.line-number.match"], syntax.keyword),
  tokenRule("Search Result Filenames", ["entity.name.filename.find-in-files"], syntax.string),
  tokenRule("Markup Heading", ["markup.heading", "markup.heading entity.name"], syntax.string, "bold"),
  tokenRule("Markup Links", ["markup.underline.link", "string.other.link"], syntax.tag),
  tokenRule("Markup Italic", ["markup.italic", "emphasis"], syntax.markup, "italic"),
  tokenRule("Markup Bold", ["markup.bold", "strong"], syntax.markup, "bold"),
  tokenRule("Markup Underline", ["markup.underline"], undefined, "underline"),
  tokenRule(
    "Markup Bold Italic",
    ["markup.italic markup.bold", "markup.bold markup.italic"],
    undefined,
    "bold italic",
  ),
  {
    name: "Markup Code",
    scope: ["markup.raw"],
    settings: {
      background: withAlpha(syntax.foreground, surfaces.isDark ? 0.03 : 0.06),
      foreground: syntax.operator,
    },
  },
  {
    name: "Markup Code Inline",
    scope: ["markup.raw.inline"],
    settings: {
      background: withAlpha(syntax.foreground, surfaces.isDark ? 0.06 : 0.08),
      foreground: syntax.operator,
    },
  },
  tokenRule("Markup Quote", ["markup.quote"], syntax.regexp, "italic"),
  tokenRule("Markup List Bullet", ["markup.list punctuation.definition.list.begin"], syntax.function),
  tokenRule("Markup Added", ["markup.inserted"], syntax.added),
  tokenRule("Markup Modified", ["markup.changed"], syntax.modified),
  tokenRule("Markup Removed", ["markup.deleted"], syntax.removed),
  tokenRule("Markup Strike", ["markup.strike"], syntax.special),
  {
    name: "Markup Table",
    scope: ["markup.table"],
    settings: {
      background: withAlpha(syntax.foreground, surfaces.isDark ? 0.05 : 0.07),
      foreground: syntax.tag,
    },
  },
];
