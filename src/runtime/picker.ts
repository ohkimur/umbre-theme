import {
  accentFamilies,
  borderVariants,
  defaultShadeForMode,
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
import type { UmbraSettings } from "@/runtime/settings.ts";
import { titleCase } from "@/utils/text.ts";
import { debounce } from "es-toolkit";
import * as vscode from "vscode";

type PickItem<Value> = vscode.QuickPickItem & {
  value: Value;
  current?: boolean;
};

type ConfigurationTarget =
  | "all"
  | "mode"
  | "shade"
  | "accent"
  | "dimming"
  | "panels"
  | "terminal"
  | "borders";
type PreviewSettings = (settings: UmbraSettings) => void;

export const pickSettings = async (
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<UmbraSettings | undefined> => {
  const target = await pickConfigurationTarget(current);
  if (!target) return undefined;

  if (target === "all") return pickAllSettings(current, previewSettings);
  return pickSingleSetting(current, target, previewSettings);
};

const pickConfigurationTarget = async (current: UmbraSettings): Promise<ConfigurationTarget | undefined> => {
  return pickValue(
    [
      {
        label: "Configure all",
        description: "Guided setup",
        detail: "Step through all Umbra theme controls.",
        value: "all",
      },
      {
        label: "Mode",
        description: titleCase(current.mode),
        detail: "Switch between Umbra Dark and Umbra Light.",
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
        description: `Level ${current.dim.level}`,
        detail: "Tune syntax color intensity in the editor only.",
        value: "dimming",
      },
      {
        label: "Panel contrast",
        description: `Level ${current.panels.level}`,
        detail: "Tune sidebar, panel, tabs, and widget contrast against the editor.",
        value: "panels",
      },
      {
        label: "Terminal contrast",
        description: `Level ${current.terminal.level}`,
        detail: "Tune terminal background contrast independently.",
        value: "terminal",
      },
      {
        label: "Border intensity",
        description: `Level ${current.borders.level}`,
        detail: "Tune outlines between workbench areas.",
        value: "borders",
      },
    ],
    "Umbra: what would you like to configure?",
  );
};

const pickSingleSetting = async (
  current: UmbraSettings,
  target: Exclude<ConfigurationTarget, "all">,
  previewSettings?: PreviewSettings,
): Promise<UmbraSettings | undefined> => {
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
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<UmbraSettings | undefined> => {
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

const pickMode = async (
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<Mode | undefined> => {
  return pickValue(
    modes.map((mode) => ({
      label: itemLabel(titleCase(mode), current.mode === mode),
      description: mode === "dark" ? "Umbra Dark" : "Umbra Light",
      value: mode,
      current: current.mode === mode,
    })),
    "Umbra: select mode",
    (mode) => ({ ...current, mode, shade: defaultShadeForMode(mode) }),
    previewSettings,
  );
};

const pickShade = async (
  current: UmbraSettings,
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
    `Umbra: select ${noun} level`,
    (shade) => ({ ...current, shade }),
    previewSettings,
  );
};

const pickAccent = async (
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<AccentFamily | undefined> => {
  return pickValue(
    accentFamilies.map((accent) => ({
      label: itemLabel(titleCase(accent), current.accent === accent),
      description: "Accent color",
      value: accent,
      current: current.accent === accent,
    })),
    "Umbra: select accent",
    (accent) => ({ ...current, accent }),
    previewSettings,
  );
};

const pickDimming = async (
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<DimVariant | undefined> => {
  return pickValue(
    dimVariants.map((dim) => ({
      label: itemLabel(`Level ${dim.level}`, current.dim.id === dim.id),
      detail: levelSlider(dim.level),
      value: dim,
      current: current.dim.id === dim.id,
    })),
    "Umbra: select editor dimming",
    (dim) => ({ ...current, dim }),
    previewSettings,
  );
};

const pickPanels = async (
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<PanelVariant | undefined> => {
  return pickValue(
    panelVariants.map((panels) => ({
      label: itemLabel(`Level ${panels.level}`, current.panels.id === panels.id),
      detail: levelSlider(panels.level),
      value: panels,
      current: current.panels.id === panels.id,
    })),
    "Umbra: select panel contrast",
    (panels) => ({ ...current, panels }),
    previewSettings,
  );
};

const pickTerminal = async (
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<TerminalVariant | undefined> => {
  return pickValue(
    terminalVariants.map((terminal) => ({
      label: itemLabel(`Level ${terminal.level}`, current.terminal.id === terminal.id),
      detail: levelSlider(terminal.level),
      value: terminal,
      current: current.terminal.id === terminal.id,
    })),
    "Umbra: select terminal contrast",
    (terminal) => ({ ...current, terminal }),
    previewSettings,
  );
};

const pickBorders = async (
  current: UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<BorderVariant | undefined> => {
  return pickValue(
    borderVariants.map((borders) => ({
      label: itemLabel(`Level ${borders.level}`, current.borders.id === borders.id),
      detail: levelSlider(borders.level),
      value: borders,
      current: current.borders.id === borders.id,
    })),
    "Umbra: select border intensity",
    (borders) => ({ ...current, borders }),
    previewSettings,
  );
};

const pickValue = async <Value>(
  items: PickItem<Value>[],
  title: string,
  preview?: (value: Value) => UmbraSettings,
  previewSettings?: PreviewSettings,
): Promise<Value | undefined> => {
  const picker = vscode.window.createQuickPick<PickItem<Value>>();
  const activeItem = items.find((item) => item.current) ?? items[0];
  picker.title = title;
  picker.ignoreFocusOut = true;
  picker.items = items;
  picker.matchOnDescription = true;
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

const shadeLabel = (mode: Mode, shade: ShadeVariant): string => {
  return mode === "dark" ? shade.darkLabel : shade.lightLabel;
};

const levelSlider = (level: number): string => {
  return Array.from({ length: 5 }, (_value, index) => (index + 1 === level ? "●" : "○")).join(" ");
};
