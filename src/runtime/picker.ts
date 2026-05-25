import {
  accentFamilies,
  borderVariants,
  defaultAccent,
  defaultBorders,
  defaultDimming,
  defaultPanels,
  defaultShadeForMode,
  defaultTerminal,
  dimVariants,
  modes,
  panelVariants,
  shadeVariants,
  terminalVariants,
  type AccentFamily,
  type BorderVariant,
  type DimVariant,
  type Mode,
  type PanelVariant,
  type ShadeVariant,
  type TerminalVariant,
} from "@/config.ts";
import type { UmbreSettings } from "@/runtime/settings.ts";
import { titleCase } from "@/utils/text.ts";
import { debounce } from "es-toolkit";
import * as vscode from "vscode";

type PickItem<Value> = vscode.QuickPickItem & {
  value: Value;
  current?: boolean;
};

type ConfigurationTarget =
  | "all"
  | "recommended"
  | "mode"
  | "shade"
  | "accent"
  | "dimming"
  | "panels"
  | "terminal"
  | "borders";
type PreviewSettings = (settings: UmbreSettings) => void;

export const pickSettings = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<UmbreSettings | undefined> => {
  const target = await pickConfigurationTarget(current);
  if (!target) return undefined;

  if (target === "all") return pickAllSettings(current, previewSettings);
  if (target === "recommended") return recommendedSettings(current.mode);
  return pickSingleSetting(current, target, previewSettings);
};

const pickConfigurationTarget = async (current: UmbreSettings): Promise<ConfigurationTarget | undefined> => {
  return pickValue(
    [
      {
        label: "Configure all",
        description: "Guided setup",
        detail: "Step through all Umbre theme controls.",
        value: "all",
      },
      {
        label: "Recommended defaults",
        description: "Reset",
        detail: "Use level 3 for shade, editor dimming, panels, and terminal; level 2 borders.",
        value: "recommended",
      },
      {
        label: "Mode",
        description: titleCase(current.mode),
        detail: "Switch between Umbre Dark and Umbre Light.",
        value: "mode",
      },
      {
        label: "Surface shade",
        description: `Level ${current.shade.level}: ${shadeLabel(current.mode, current.shade)}`,
        detail: "Set the editor base darkness/lightness.",
        value: "shade",
      },
      {
        label: "Accent color",
        description: titleCase(current.accent),
        detail: "Change command, cursor, focus, badge, and active states.",
        value: "accent",
      },
      {
        label: "Editor dimming",
        description: settingSummary(current.dim),
        detail: "Tune syntax color intensity in the editor only.",
        value: "dimming",
      },
      {
        label: "Panel contrast",
        description: settingSummary(current.panels),
        detail: "Tune sidebar, panel, tabs, and widget contrast against the editor.",
        value: "panels",
      },
      {
        label: "Terminal contrast",
        description: settingSummary(current.terminal),
        detail: "Tune terminal background contrast independently.",
        value: "terminal",
      },
      {
        label: "Border intensity",
        description: settingSummary(current.borders),
        detail: "Tune outlines between workbench areas.",
        value: "borders",
      },
    ],
    "Umbre: what would you like to configure?",
  );
};

const pickSingleSetting = async (
  current: UmbreSettings,
  target: Exclude<ConfigurationTarget, "all" | "recommended">,
  previewSettings?: PreviewSettings,
): Promise<UmbreSettings | undefined> => {
  switch (target) {
    case "mode": {
      const mode = await pickMode(current, previewSettings);
      return mode ? { ...current, mode, shade: defaultShadeForMode(mode) } : undefined;
    }
    case "shade": {
      const shade = await pickShade(current, previewSettings);
      return shade ? { ...current, shade } : undefined;
    }
    case "accent": {
      const accent = await pickAccent(current, previewSettings);
      return accent ? { ...current, accent } : undefined;
    }
    case "dimming": {
      const dim = await pickDimming(current, previewSettings);
      return dim ? { ...current, dim } : undefined;
    }
    case "panels": {
      const panels = await pickPanels(current, previewSettings);
      return panels ? { ...current, panels } : undefined;
    }
    case "terminal": {
      const terminal = await pickTerminal(current, previewSettings);
      return terminal ? { ...current, terminal } : undefined;
    }
    case "borders": {
      const borders = await pickBorders(current, previewSettings);
      return borders ? { ...current, borders } : undefined;
    }
  }
};

const pickAllSettings = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<UmbreSettings | undefined> => {
  const mode = await pickMode(current, previewSettings);
  if (!mode) return undefined;
  const withMode = { ...current, mode, shade: defaultShadeForMode(mode) };

  const shade = await pickShade(withMode, previewSettings);
  if (!shade) return undefined;
  const withShade = { ...withMode, shade };

  const accent = await pickAccent(withShade, previewSettings);
  if (!accent) return undefined;
  const withAccent = { ...withShade, accent };

  const dim = await pickDimming(withAccent, previewSettings);
  if (!dim) return undefined;
  const withDimming = { ...withAccent, dim };

  const panels = await pickPanels(withDimming, previewSettings);
  if (!panels) return undefined;
  const withPanels = { ...withDimming, panels };

  const terminal = await pickTerminal(withPanels, previewSettings);
  if (!terminal) return undefined;
  const withTerminal = { ...withPanels, terminal };

  const borders = await pickBorders(withTerminal, previewSettings);
  if (!borders) return undefined;

  return { ...withTerminal, borders };
};

const recommendedSettings = (mode: Mode): UmbreSettings => ({
  mode,
  shade: defaultShadeForMode(mode),
  accent: defaultAccent,
  dim: defaultDimming,
  panels: defaultPanels,
  terminal: defaultTerminal,
  borders: defaultBorders,
});

const pickMode = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<Mode | undefined> => {
  return pickValue(
    modes.map((mode) => ({
      label: itemLabel(titleCase(mode), current.mode === mode),
      description: mode === "dark" ? "Umbre Dark" : "Umbre Light",
      value: mode,
      current: current.mode === mode,
    })),
    "Umbre: select mode",
    (mode) => ({ ...current, mode, shade: defaultShadeForMode(mode) }),
    previewSettings,
  );
};

const pickShade = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<ShadeVariant | undefined> => {
  const noun = current.mode === "dark" ? "darkness" : "lightness";

  return pickValue(
    shadeVariants.map((shade) => ({
      label: itemLabel(`Level ${shade.level}`, current.shade.id === shade.id),
      description: shadeLabel(current.mode, shade),
      detail: levelSlider(shade.level),
      value: shade,
      current: current.shade.id === shade.id,
    })),
    `Umbre: select ${noun} level`,
    (shade) => ({ ...current, shade }),
    previewSettings,
  );
};

const pickAccent = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<AccentFamily | undefined> => {
  return pickValue(
    accentFamilies.map((accent) => ({
      label: itemLabel(titleCase(accent), current.accent === accent),
      description: "Accent color",
      value: accent,
      current: current.accent === accent,
    })),
    "Umbre: select accent",
    (accent) => ({ ...current, accent }),
    previewSettings,
  );
};

const pickDimming = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<DimVariant | undefined> => {
  return pickValue(
    dimVariants.map((dim) => ({
      label: itemLabel(`Level ${dim.level}`, current.dim.id === dim.id),
      description: dim.label,
      detail: settingDetail(dim),
      value: dim,
      current: current.dim.id === dim.id,
    })),
    "Umbre: select editor dimming",
    (dim) => ({ ...current, dim }),
    previewSettings,
  );
};

const pickPanels = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<PanelVariant | undefined> => {
  return pickValue(
    panelVariants.map((panels) => ({
      label: itemLabel(`Level ${panels.level}`, current.panels.id === panels.id),
      description: panels.label,
      detail: settingDetail(panels),
      value: panels,
      current: current.panels.id === panels.id,
    })),
    "Umbre: select panel contrast",
    (panels) => ({ ...current, panels }),
    previewSettings,
  );
};

const pickTerminal = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<TerminalVariant | undefined> => {
  return pickValue(
    terminalVariants.map((terminal) => ({
      label: itemLabel(`Level ${terminal.level}`, current.terminal.id === terminal.id),
      description: terminal.label,
      detail: settingDetail(terminal),
      value: terminal,
      current: current.terminal.id === terminal.id,
    })),
    "Umbre: select terminal contrast",
    (terminal) => ({ ...current, terminal }),
    previewSettings,
  );
};

const pickBorders = async (
  current: UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<BorderVariant | undefined> => {
  return pickValue(
    borderVariants.map((borders) => ({
      label: itemLabel(`Level ${borders.level}`, current.borders.id === borders.id),
      description: borders.label,
      detail: settingDetail(borders),
      value: borders,
      current: current.borders.id === borders.id,
    })),
    "Umbre: select border intensity",
    (borders) => ({ ...current, borders }),
    previewSettings,
  );
};

const pickValue = async <Value>(
  items: PickItem<Value>[],
  title: string,
  preview?: (value: Value) => UmbreSettings,
  previewSettings?: PreviewSettings,
): Promise<Value | undefined> => {
  const picker = vscode.window.createQuickPick<PickItem<Value>>();
  const activeItem = items.find((item) => item.current) ?? items[0];
  picker.title = title;
  picker.ignoreFocusOut = true;
  picker.items = items;
  picker.matchOnDescription = true;
  picker.matchOnDetail = true;
  if (activeItem) picker.activeItems = [activeItem];

  return new Promise((resolve) => {
    let settled = false;
    const done = (value: Value | undefined): void => {
      if (settled) return;
      settled = true;
      picker.dispose();
      resolve(value);
    };

    const previewNow = (item: PickItem<Value> | undefined): void => {
      if (item && preview) previewSettings?.(preview(item.value));
    };
    const previewLater = debounce(previewNow, 160);

    picker.onDidChangeActive((active) => {
      const [item] = active;
      previewLater(item);
    });
    picker.onDidAccept(() => {
      previewLater.flush();
      const [item] = picker.activeItems;
      done(item?.value);
    });
    picker.onDidHide(() => {
      previewLater.cancel();
      done(undefined);
    });
    picker.show();
  });
};

const itemLabel = (label: string, selected: boolean): string => (selected ? `$(check) ${label}` : label);

const settingSummary = (setting: { level: number; label: string }): string => {
  return `Level ${setting.level}: ${setting.label}`;
};

const settingDetail = (setting: { level: number; detail: string }): string => {
  return `${levelSlider(setting.level)}  ${setting.detail}`;
};

const shadeLabel = (mode: Mode, shade: ShadeVariant): string => {
  return mode === "dark" ? shade.darkLabel : shade.lightLabel;
};

const levelSlider = (level: number): string => {
  return Array.from({ length: 5 }, (_value, index) => (index + 1 === level ? "●" : "○")).join(" ");
};
