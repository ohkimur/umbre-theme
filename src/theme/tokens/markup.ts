import { markdownColorId, markdownColors, markdownTextColors } from "@/theme/markdown.ts";
import type { ThemeModel } from "@/theme/model.ts";
import { withAlpha } from "@/theme/palette.ts";
import { tokenRule } from "@/theme/token-rule.ts";
import type { TokenColor } from "@/theme/types.ts";

/** Markup source mirrors the rendered Markdown colors, so writing and reading look like one document. */
export const markupTokenColors = (model: ThemeModel): TokenColor[] => {
  const { surfaces, syntax } = model;
  const colors = markdownColors(model);
  const text = markdownTextColors(model);
  const markdown = (name: string): string => colors[markdownColorId(name)] ?? text[name] ?? syntax.foreground;

  return [
    tokenRule(
      "Search Result Line Numbers",
      ["constant.numeric.line-number.find-in-files - match"],
      syntax.comment,
    ),
    tokenRule("Search Result Matches", ["constant.numeric.line-number.match"], syntax.keyword),
    tokenRule("Search Result Filenames", ["entity.name.filename.find-in-files"], syntax.string),
    tokenRule(
      "Markup Heading",
      ["markup.heading", "markup.heading entity.name", "entity.name.section.markdown"],
      markdown("heading"),
      "bold",
    ),
    tokenRule(
      "Markup Punctuation",
      [
        "punctuation.definition.heading.markdown",
        "punctuation.definition.bold.markdown",
        "punctuation.definition.italic.markdown",
        "punctuation.definition.strikethrough.markdown",
        "punctuation.definition.quote.begin.markdown",
        "punctuation.definition.list.begin.markdown",
        "punctuation.definition.table.markdown",
        "punctuation.separator.table.markdown",
        "punctuation.definition.link",
        "punctuation.definition.metadata.markdown",
        "punctuation.definition.string.begin.markdown",
        "punctuation.definition.string.end.markdown",
        "meta.separator.markdown",
      ],
      markdown("marker"),
    ),
    tokenRule(
      "Markup Link Text",
      ["string.other.link.title", "string.other.link.description", "constant.other.reference.link.markdown"],
      markdown("textLink.foreground"),
    ),
    tokenRule("Markup Link Target", ["markup.underline.link"], markdown("muted")),
    tokenRule("Markup Italic", ["markup.italic", "emphasis"], markdown("text"), "italic"),
    tokenRule("Markup Bold", ["markup.bold", "strong"], markdown("heading"), "bold"),
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
        foreground: markdown("textPreformat.foreground"),
      },
    },
    {
      name: "Markup Code Inline",
      scope: ["markup.raw.inline", "markup.inline.raw.string.markdown"],
      settings: {
        background: withAlpha(syntax.foreground, surfaces.isDark ? 0.06 : 0.08),
        foreground: markdown("textPreformat.foreground"),
      },
    },
    tokenRule("Markup Code Fence Language", ["fenced_code.block.language"], markdown("muted")),
    tokenRule("Markup Quote", ["markup.quote"], markdown("text")),
    tokenRule("Markup Table", ["markup.table"], markdown("text")),
    tokenRule("Markup Added", ["markup.inserted"], syntax.added),
    tokenRule("Markup Modified", ["markup.changed"], syntax.modified),
    tokenRule("Markup Removed", ["markup.deleted"], syntax.removed),
    tokenRule("Markup Strike", ["markup.strike", "markup.strikethrough"], markdown("muted")),
  ];
};
