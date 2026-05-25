import type { ThemeModel } from "@/theme/model.ts";
import { withAlpha } from "@/theme/palette.ts";
import type { ColorMap } from "@/theme/types.ts";

export const breadcrumbColors = ({ surfaces }: ThemeModel): ColorMap => ({
  "breadcrumb.background": surfaces.chrome1,
  "breadcrumb.foreground": surfaces.muted,
  "breadcrumb.focusForeground": surfaces.fg,
  "breadcrumb.activeSelectionForeground": surfaces.fg,
  "breadcrumbPicker.background": surfaces.overlay,
});

export const peekColors = ({ accent, surfaces }: ThemeModel): ColorMap => ({
  "peekView.border": surfaces.lineStrong,
  "peekViewEditor.background": surfaces.chrome1,
  "peekViewEditor.matchHighlightBackground": withAlpha(accent.main, 0.16),
  "peekViewEditor.matchHighlightBorder": accent.border,
  "peekViewEditorGutter.background": surfaces.chrome1,
  "peekViewResult.background": surfaces.chrome3,
  "peekViewResult.fileForeground": surfaces.fg,
  "peekViewResult.lineForeground": surfaces.muted,
  "peekViewResult.matchHighlightBackground": withAlpha(accent.main, 0.16),
  "peekViewResult.selectionBackground": surfaces.raised,
  "peekViewResult.selectionForeground": surfaces.fg,
  "peekViewTitle.background": surfaces.overlay,
  "peekViewTitleLabel.foreground": surfaces.fg,
  "peekViewTitleDescription.foreground": surfaces.muted,
});

export const menuColors = ({ surfaces }: ThemeModel): ColorMap => ({
  "menu.background": surfaces.overlay,
  "menu.foreground": surfaces.fg,
  "menu.selectionBackground": surfaces.raised,
  "menu.selectionForeground": surfaces.fg,
  "menu.separatorBackground": surfaces.lineStrong,
  "menu.border": surfaces.lineStrong,
  "menubar.selectionBackground": surfaces.raised,
  "menubar.selectionForeground": surfaces.fg,
});
