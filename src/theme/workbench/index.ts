import type { ThemeModel } from "@/theme/model.ts";
import { transparent, withAlpha } from "@/theme/palette.ts";
import type { ColorMap } from "@/theme/types.ts";
import { baseColors } from "@/theme/workbench/base.ts";
import {
  activityBarColors,
  panelColors,
  sideBarColors,
  tabColors,
  titleAndStatusColors,
} from "@/theme/workbench/chrome.ts";
import { controlColors, textColors } from "@/theme/workbench/controls.ts";
import { debugColors, diagnosticsColors } from "@/theme/workbench/diagnostics.ts";
import { bracketColors, editorColors } from "@/theme/workbench/editor.ts";
import { inputColors } from "@/theme/workbench/inputs.ts";
import { listColors, scrollBarColors } from "@/theme/workbench/lists.ts";
import { minimapColors } from "@/theme/workbench/minimap.ts";
import { chartColors, chatColors, testingColors, welcomeColors } from "@/theme/workbench/misc.ts";
import { breadcrumbColors, menuColors, peekColors } from "@/theme/workbench/navigation.ts";
import { settingsColors } from "@/theme/workbench/settings.ts";
import { symbolColors } from "@/theme/workbench/symbols.ts";
import { terminalColors } from "@/theme/workbench/terminal.ts";
import { vcsColors } from "@/theme/workbench/vcs.ts";
import { notificationColors, editorWidgetColors, quickInputColors } from "@/theme/workbench/widgets.ts";

export const workbenchColors = (model: ThemeModel): ColorMap => {
  const colors: ColorMap = {
    ...baseColors(model),
    ...editorColors(model),
    ...bracketColors(model),
    ...tabColors(model),
    ...activityBarColors(model),
    ...sideBarColors(model),
    ...panelColors(model),
    ...titleAndStatusColors(model),
    ...terminalColors(model),
    ...editorWidgetColors(model),
    ...quickInputColors(model),
    ...notificationColors(model),
    ...inputColors(model),
    ...listColors(model),
    ...scrollBarColors(model),
    ...minimapColors(model),
    ...breadcrumbColors(model),
    ...peekColors(model),
    ...menuColors(model),
    ...vcsColors(model),
    ...diagnosticsColors(model),
    ...debugColors(model),
    ...controlColors(model),
    ...textColors(model),
    ...settingsColors(model),
    ...welcomeColors(model),
    ...testingColors(model),
    ...chartColors(model),
    ...chatColors(model),
    ...symbolColors(model),
  };

  return withBorderIntensity(colors, model.borders.opacity);
};

const withBorderIntensity = (colors: ColorMap, opacity: number): ColorMap => {
  return Object.fromEntries(
    Object.entries(colors).map(([key, value]) => {
      if (!isBorderColorKey(key) || isWindowFrameBorderKey(key) || value === transparent())
        return [key, value];
      return [key, opacity === 0 ? transparent() : withAlpha(value, opacity)];
    }),
  );
};

const isBorderColorKey = (key: string): boolean => /border|outline/i.test(key);

const isWindowFrameBorderKey = (key: string): boolean =>
  key === "window.activeBorder" || key === "window.inactiveBorder";
