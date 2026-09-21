import { ensureContrast } from "@/theme/markdown.ts";
import type { ThemeModel } from "@/theme/model.ts";
import { mix, tw } from "@/theme/palette.ts";
import type { ColorMap } from "@/theme/types.ts";

export const welcomeColors = ({ accent, surfaces }: ThemeModel): ColorMap => ({
  "welcomePage.background": surfaces.editor,
  "welcomePage.tileBackground": surfaces.chrome3,
  "welcomePage.tileHoverBackground": surfaces.overlay,
  "welcomePage.tileBorder": surfaces.line,
  "welcomePage.progress.background": surfaces.line,
  "welcomePage.progress.foreground": accent.main,
});

export const testingColors = ({ accent, surfaces, uiSyntax: syntax }: ThemeModel): ColorMap => ({
  "testing.iconFailed": syntax.invalid,
  "testing.iconErrored": syntax.invalid,
  "testing.iconPassed": syntax.added,
  "testing.iconQueued": accent.main,
  "testing.iconUnset": surfaces.muted,
  "testing.iconSkipped": surfaces.muted,
});

/**
 * Chart fills, also used by Mermaid for pie slices and timeline, journey, and mindmap blocks, which put
 * text on them. Dark mode uses deep, muted fills under light text; light mode uses mid tones under
 * dark text. Either way the label keeps at least 4.5:1.
 */
const chartFill = (surfaces: ThemeModel["surfaces"], family: string): string => {
  const base = surfaces.isDark
    ? mix(tw(family, 700), tw("zinc", 800), 0.2)
    : mix(tw(family, 500), tw("zinc", 300), 0.15);
  return ensureContrast(base, [surfaces.fg], surfaces.editor, 4.5);
};

export const chartColors = ({ surfaces }: ThemeModel): ColorMap => ({
  "charts.foreground": surfaces.fg,
  "charts.lines": surfaces.line,
  // Chart and diagram strokes (also Mermaid node borders and arrows in Markdown previews).
  "chart.line": ensureContrast(mix(surfaces.editor, surfaces.muted, 0.8), [surfaces.editor], surfaces.fg, 3),
  "chart.axis": surfaces.lineStrong,
  "chart.guide": surfaces.line,
  "charts.red": chartFill(surfaces, "rose"),
  "charts.blue": chartFill(surfaces, "blue"),
  "charts.yellow": chartFill(surfaces, "amber"),
  "charts.orange": chartFill(surfaces, "orange"),
  "charts.green": chartFill(surfaces, "emerald"),
  "charts.purple": chartFill(surfaces, "violet"),
});

export const chatColors = ({ surfaces }: ThemeModel): ColorMap => ({
  "chat.requestBackground": surfaces.chrome3,
  "chat.requestBorder": surfaces.line,
});
