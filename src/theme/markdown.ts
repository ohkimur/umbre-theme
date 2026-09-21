import type { ThemeModel } from "@/theme/model.ts";
import { mix, tw, withAlpha, type Shade } from "@/theme/palette.ts";
import type { ColorMap } from "@/theme/types.ts";
import { wcagContrast } from "culori";

/**
 * Markdown colors. Roles VS Code already names (links, inline code, code blocks, quotes, separators)
 * are set on the standard workbench `text*` colors, so the Markdown editor, previews, and hovers share
 * them. The rest are registered as `umbreMarkdown.*` colors for the preview stylesheet.
 */
type MarkdownColor = {
  name: string;
  description: string;
  /** Workbench color other themes fall back to; Umbre's stylesheet is scoped to Umbre anyway. */
  fallback: string;
  value: (palette: MarkdownPalette) => string;
};

type MarkdownPalette = ThemeModel & {
  /** Meets body-text contrast on every surface Markdown text sits on (page, table rows, quotes). */
  readable: (color: string) => string;
  ink: (amount: number) => string;
  alert: (family: string) => string;
  /** Opaque content rule from Umbre's line colors, following the border intensity setting. */
  rule: (strength: "line" | "lineStrong") => string;
  atLeast: (color: string, role: keyof typeof structureContrast) => string;
  backgrounds: Record<"tableHeader" | "quote" | "code" | "inlineCode", string>;
};

export type ColorContribution = {
  id: string;
  description: string;
  defaults: { dark: string; light: string; highContrast: string; highContrastLight: string };
};

/** WCAG AA for body text. */
const minimumTextContrast = 4.5;

/**
 * Minimum contrast against the page for quiet structure. Contrast compresses near black, so fixed
 * mixes vanish on pure black; targets keep every shade equally legible without getting louder.
 */
const structureContrast = {
  rule: 1.6,
  softRule: 1.3,
  tableRule: 1.2,
  marker: 3,
  tableHeader: 1.12,
  quote: 1.05,
  code: 1.06,
} as const;

/** One dot only: webviews expose `umbreMarkdown.text` as `--vscode-umbreMarkdown-text`. */
const markdownColorPrefix = "umbreMarkdown";

const markdownColorDefinitions: MarkdownColor[] = [
  // Reading surface
  {
    name: "text",
    description: "Body text",
    fallback: "editor.foreground",
    value: ({ surfaces, ink }) => ink(surfaces.isDark ? 0.86 : 0.88),
  },
  {
    name: "heading",
    description: "Headings, bold text, and table headers",
    fallback: "editor.foreground",
    value: ({ surfaces, ink }) => ink(surfaces.isDark ? 0.97 : 0.98),
  },
  {
    name: "muted",
    description: "Secondary text",
    fallback: "descriptionForeground",
    value: ({ surfaces, readable }) => readable(surfaces.muted),
  },
  {
    name: "rule",
    description: "Heading rules, table outlines, and quote bars",
    fallback: "textSeparator.foreground",
    value: ({ rule }) => rule("lineStrong"),
  },
  {
    name: "softRule",
    description: "Table cell and code block separators",
    fallback: "textSeparator.foreground",
    value: ({ rule }) => rule("line"),
  },
  {
    name: "tableRule",
    description: "Table outline and row lines, dimmer than other rules",
    fallback: "textSeparator.foreground",
    value: ({ surfaces, atLeast }) =>
      atLeast(mix(surfaces.editor, withAlpha(surfaces.line, 1), 0.55), "tableRule"),
  },
  {
    name: "tableHeader",
    description: "Table header background",
    fallback: "textCodeBlock.background",
    value: ({ backgrounds }) => backgrounds.tableHeader,
  },
  {
    name: "marker",
    description: "Markdown markers and directory tree guides",
    fallback: "descriptionForeground",
    value: ({ syntax, atLeast }) => atLeast(syntax.comment, "marker"),
  },

  // Alerts
  {
    name: "note",
    description: "Note alerts",
    fallback: "editorInfo.foreground",
    value: ({ alert, readable }) => readable(alert("sky")),
  },
  {
    name: "tip",
    description: "Tip alerts",
    fallback: "testing.iconPassed",
    value: ({ alert, readable }) => readable(alert("emerald")),
  },
  {
    name: "important",
    description: "Important alerts",
    fallback: "textLink.foreground",
    value: ({ alert, readable }) => readable(alert("violet")),
  },
  {
    name: "warning",
    description: "Warning alerts and highlighted text",
    fallback: "editorWarning.foreground",
    value: ({ alert, readable }) => readable(alert("amber")),
  },
  {
    name: "caution",
    description: "Caution alerts",
    fallback: "editorError.foreground",
    value: ({ alert, readable }) => readable(alert("rose")),
  },

  // Code blocks, mirroring editor token colors
  {
    name: "syntaxForeground",
    description: "Code text",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.foreground,
  },
  {
    name: "syntaxComment",
    description: "Code comments",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.comment,
  },
  {
    name: "syntaxKeyword",
    description: "Code keywords",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.keyword,
  },
  {
    name: "syntaxOperator",
    description: "Code operators and punctuation",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.operator,
  },
  {
    name: "syntaxString",
    description: "Code strings",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.string,
  },
  {
    name: "syntaxRegexp",
    description: "Code regular expressions",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.regexp,
  },
  {
    name: "syntaxConstant",
    description: "Code constants",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.constant,
  },
  {
    name: "syntaxFunction",
    description: "Code functions",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.function,
  },
  {
    name: "syntaxType",
    description: "Code types",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.type,
  },
  {
    name: "syntaxClass",
    description: "Code classes",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.class,
  },
  {
    name: "syntaxTag",
    description: "Code tags",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.tag,
  },
  {
    name: "syntaxAttribute",
    description: "Code attributes",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.attribute,
  },
  {
    name: "syntaxProperty",
    description: "Code properties",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.property,
  },
  {
    name: "syntaxParameter",
    description: "Code parameters",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.parameter,
  },
  {
    name: "syntaxSpecial",
    description: "Code meta and special tokens",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.special,
  },
  {
    name: "syntaxMarkup",
    description: "Code emphasis",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.markup,
  },
  {
    name: "syntaxAdded",
    description: "Code insertions",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.added,
  },
  {
    name: "syntaxRemoved",
    description: "Code deletions",
    fallback: "editor.foreground",
    value: ({ syntax }) => syntax.removed,
  },
];

export const markdownColorId = (name: string): string => `${markdownColorPrefix}.${name}`;

export const markdownColors = (model: ThemeModel): ColorMap => {
  const palette = markdownPalette(model);
  return Object.fromEntries(
    markdownColorDefinitions.map((color) => [markdownColorId(color.name), color.value(palette)]),
  );
};

/**
 * A quiet separator that stays visible on every shade, following the border intensity setting with a
 * contrast floor. Markdown rules and the line between split editors share it.
 */
export const separatorColor = (model: ThemeModel): string => markdownPalette(model).rule("line");

/** Workbench text colors, derived from the same roles so every Markdown surface agrees. */
export const markdownTextColors = (model: ThemeModel): ColorMap => {
  const { accent, uiSyntax, readable, backgrounds, rule } = markdownPalette(model);
  return {
    "textLink.foreground": readable(accent.main),
    "textLink.activeForeground": readable(accent.hover),
    "textPreformat.foreground": readable(uiSyntax.operator),
    "textPreformat.background": backgrounds.inlineCode,
    "textCodeBlock.background": backgrounds.code,
    "textBlockQuote.background": backgrounds.quote,
    "textBlockQuote.border": rule("lineStrong"),
    "textSeparator.foreground": rule("line"),
  };
};

export const markdownColorContributions = (): ColorContribution[] =>
  markdownColorDefinitions.map((color) => ({
    id: markdownColorId(color.name),
    description: `${color.description} in Umbre Markdown views.`,
    defaults: {
      dark: color.fallback,
      light: color.fallback,
      highContrast: color.fallback,
      highContrastLight: color.fallback,
    },
  }));

/** Nudges a color toward the foreground until it reads comfortably on every background. */
export const ensureContrast = (
  color: string,
  backgrounds: readonly string[],
  foreground: string,
  minimum = minimumTextContrast,
): string => {
  const readsOnAll = (candidate: string): boolean =>
    backgrounds.every((background) => wcagContrast(candidate, background) >= minimum);

  for (let amount = 0; amount < 1; amount += 0.01) {
    const candidate = amount === 0 ? color : mix(color, foreground, amount);
    if (readsOnAll(candidate)) return candidate;
  }
  return foreground;
};

const markdownPalette = (model: ThemeModel): MarkdownPalette => {
  const { mode, dim, surfaces, borders, uiSyntax } = model;
  const neutral = surfaces.isDark ? tw("zinc", 400) : tw("zinc", 700);
  const alertShade: Shade = surfaces.isDark ? 400 : 700;
  const alertMix = mode === "dark" ? dim.syntaxMix * 0.6 : dim.syntaxMix * 0.4;
  const ink = (amount: number): string => mix(surfaces.editor, surfaces.fg, amount);
  // Content rules stay legible even with hidden workbench borders, then strengthen with the setting.
  const ruleWeight = Math.min(0.72 + borders.opacity * 0.34, 1);
  const atLeast = (color: string, role: keyof typeof structureContrast): string =>
    ensureContrast(color, [surfaces.editor], surfaces.fg, structureContrast[role]);
  const backgrounds = {
    tableHeader: atLeast(ink(surfaces.isDark ? 0.09 : 0.06), "tableHeader"),
    quote: atLeast(ink(surfaces.isDark ? 0.03 : 0.035), "quote"),
    code: atLeast(mix(surfaces.editor, surfaces.chrome3, 0.7), "code"),
    inlineCode: atLeast(mix(surfaces.editor, uiSyntax.foreground, surfaces.isDark ? 0.09 : 0.08), "code"),
  };
  const readingSurfaces = [surfaces.editor, ...Object.values(backgrounds)];

  return {
    ...model,
    readable: (color) => ensureContrast(color, readingSurfaces, surfaces.fg),
    ink,
    alert: (family) => mix(tw(family, alertShade), neutral, alertMix),
    rule: (strength) =>
      atLeast(
        mix(surfaces.editor, withAlpha(surfaces[strength], 1), ruleWeight),
        strength === "lineStrong" ? "rule" : "softRule",
      ),
    atLeast,
    backgrounds,
  };
};
