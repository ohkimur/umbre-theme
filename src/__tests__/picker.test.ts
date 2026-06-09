import { beforeEach, describe, expect, mock, test } from "bun:test";

import type { UmbreSettings } from "@/runtime/settings.ts";

type CapturedPicker = {
  title: string;
  activeLabel: string | undefined;
};

type PickItem = {
  label: string;
  value: unknown;
};

let capturedPickers: CapturedPicker[] = [];

mock.module("vscode", () => ({
  window: {
    createQuickPick: () => {
      let accept: (() => void) | undefined;
      const picker = {
        title: "",
        ignoreFocusOut: false,
        items: [] as PickItem[],
        matchOnDescription: false,
        matchOnDetail: false,
        activeItems: [] as PickItem[],
        onDidChangeActive: () => ({ dispose: () => undefined }),
        onDidAccept: (callback: () => void) => {
          accept = callback;
          return { dispose: () => undefined };
        },
        onDidHide: () => ({ dispose: () => undefined }),
        show: () => {
          capturedPickers.push({
            title: picker.title,
            activeLabel: picker.activeItems[0]?.label,
          });
          queueMicrotask(() => accept?.());
        },
        dispose: () => undefined,
      };
      return picker;
    },
  },
}));

const { pickSettings } = await import("@/runtime/picker.ts");
const { panelVariants } = await import("@/config.ts");
const { defaultSettings } = await import("@/runtime/settings.ts");

describe("Umbre settings picker defaults", () => {
  beforeEach(() => {
    capturedPickers = [];
  });

  test("keeps the current saved panel contrast active when it exists", async () => {
    const current = {
      ...defaultSettings(),
      panels: panelVariants[4],
    } satisfies UmbreSettings;

    await pickSettings(current, undefined, "panels");

    expect(capturedPickers).toEqual([
      {
        title: "Umbre: select panel contrast",
        activeLabel: "$(check) Level 5",
      },
    ]);
  });

  test("falls back to the default panel contrast when the current item has no match", async () => {
    const current = {
      ...defaultSettings(),
      panels: {
        id: "custom",
        level: 99,
        label: "Custom panels",
        detail: "Not part of the built-in picker.",
        surfaceContrast: 2,
      },
    } as unknown as UmbreSettings;

    await pickSettings(current, undefined, "panels");

    expect(capturedPickers).toEqual([
      {
        title: "Umbre: select panel contrast",
        activeLabel: "Level 3",
      },
    ]);
  });

  test("falls back to the balanced recommended preset when no preset matches", async () => {
    const current = {
      ...defaultSettings(),
      systemAware: true,
    } satisfies UmbreSettings;

    await pickSettings(current, undefined, "recommended");

    expect(capturedPickers).toEqual([
      {
        title: "Umbre: select recommended preset",
        activeLabel: "Balanced",
      },
    ]);
  });
});
