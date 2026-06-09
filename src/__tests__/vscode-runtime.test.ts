import { beforeEach, describe, expect, mock, test } from "bun:test";

const colorThemeKinds = {
  light: 1,
  dark: 2,
  highContrast: 3,
  highContrastLight: 4,
} as const;

type WorkbenchThemeState = {
  colorTheme: string;
  preferredDarkColorTheme: string;
  preferredLightColorTheme: string;
  autoDetectColorScheme: boolean;
  activeColorThemeKind: number;
};

const defaultThemeState = (): WorkbenchThemeState => ({
  colorTheme: "",
  preferredDarkColorTheme: "",
  preferredLightColorTheme: "",
  autoDetectColorScheme: false,
  activeColorThemeKind: colorThemeKinds.dark,
});

let activeIconTheme = "";
let symbolsInstalled = false;
let themeState: WorkbenchThemeState = defaultThemeState();
let informationChoices: (string | undefined)[] = [];
let informationMessages: string[] = [];
let commandCalls: unknown[][] = [];
let updatedIconTheme: string | undefined;

mock.module("vscode", () => ({
  commands: {
    executeCommand: async (...args: unknown[]) => {
      commandCalls.push(args);
      if (args[0] === "workbench.extensions.installExtension") symbolsInstalled = true;
    },
  },
  ConfigurationTarget: {
    Global: 1,
  },
  ColorThemeKind: {
    Light: colorThemeKinds.light,
    Dark: colorThemeKinds.dark,
    HighContrast: colorThemeKinds.highContrast,
    HighContrastLight: colorThemeKinds.highContrastLight,
  },
  extensions: {
    getExtension: (id: string) => (symbolsInstalled && id === "miguelsolorio.symbols" ? { id } : undefined),
  },
  ProgressLocation: {
    Notification: 15,
  },
  window: {
    activeColorTheme: {
      get kind() {
        return themeState.activeColorThemeKind;
      },
    },
    showInformationMessage: async (message: string) => {
      informationMessages.push(message);
      return informationChoices.shift();
    },
    withProgress: async (_options: unknown, task: () => Promise<unknown>) => task(),
  },
  workspace: {
    getConfiguration: (section: string) => {
      expect(["window", "workbench"]).toContain(section);
      return {
        get: (key: string, fallback = "") => {
          if (section === "window" && key === "autoDetectColorScheme")
            return themeState.autoDetectColorScheme;
          if (key === "iconTheme") return activeIconTheme;
          if (key === "colorTheme") return themeState.colorTheme || fallback;
          if (key === "preferredDarkColorTheme") return themeState.preferredDarkColorTheme || fallback;
          if (key === "preferredLightColorTheme") return themeState.preferredLightColorTheme || fallback;
          return fallback;
        },
        update: async (key: string, value: string) => {
          expect(key).toBe("iconTheme");
          updatedIconTheme = value;
          activeIconTheme = value;
        },
      };
    },
  },
}));

const { resetSymbolsIconThemePromptForTests, suggestSymbolsIconTheme } =
  await import("@/runtime/icon-theme-recommendation.ts");
const { isUmbreThemeActive, isUmbreThemeConfigured } = await import("@/runtime/active-theme.ts");

describe("Umbre Symbols recommendation", () => {
  beforeEach(() => {
    resetTestState();
    resetSymbolsIconThemePromptForTests();
  });

  test("installs Symbols and applies it from Cursor notifications", async () => {
    informationChoices = ["Install Symbols", "Use Symbols"];

    await suggestSymbolsIconTheme();

    expect(informationMessages).toEqual([
      "Umbre pairs well with Symbols, a simple file icon theme.",
      "Symbols is ready. Use it as your file icon theme?",
    ]);
    expect(commandCalls).toEqual([["workbench.extensions.installExtension", "miguelsolorio.symbols"]]);
    expect(updatedIconTheme).toBe("symbols");
  });

  test("does not keep a permanent dismissal across sessions", async () => {
    informationChoices = ["Not now"];
    await suggestSymbolsIconTheme();
    await suggestSymbolsIconTheme();

    expect(informationMessages).toHaveLength(1);

    resetSymbolsIconThemePromptForTests();
    informationChoices = ["Not now"];
    await suggestSymbolsIconTheme();

    expect(informationMessages).toHaveLength(2);
  });

  test("skips the recommendation when Symbols is already active", async () => {
    activeIconTheme = "symbols";

    await suggestSymbolsIconTheme();

    expect(informationMessages).toHaveLength(0);
    expect(commandCalls).toHaveLength(0);
    expect(updatedIconTheme).toBeUndefined();
  });
});

describe("Umbre active theme detection", () => {
  beforeEach(resetTestState);

  test("treats Umbre in colorTheme as active and configured", () => {
    setThemeState({ colorTheme: "Umbre" });

    expect(isUmbreThemeActive()).toBe(true);
    expect(isUmbreThemeConfigured()).toBe(true);
  });

  test("treats auto-detected preferred dark Umbre as active", () => {
    setThemeState({
      colorTheme: "Default Dark Modern",
      preferredDarkColorTheme: "Umbre",
      autoDetectColorScheme: true,
      activeColorThemeKind: colorThemeKinds.dark,
    });

    expect(isUmbreThemeActive()).toBe(true);
    expect(isUmbreThemeConfigured()).toBe(true);
  });

  test("treats auto-detected preferred light Umbre as active", () => {
    setThemeState({
      colorTheme: "Default Light Modern",
      preferredLightColorTheme: "Umbre",
      autoDetectColorScheme: true,
      activeColorThemeKind: colorThemeKinds.light,
    });

    expect(isUmbreThemeActive()).toBe(true);
    expect(isUmbreThemeConfigured()).toBe(true);
  });

  test("does not treat inactive preferred Umbre themes as active", () => {
    setThemeState({
      colorTheme: "Default Dark Modern",
      preferredLightColorTheme: "Umbre",
      autoDetectColorScheme: true,
      activeColorThemeKind: colorThemeKinds.dark,
    });

    expect(isUmbreThemeActive()).toBe(false);
    expect(isUmbreThemeConfigured()).toBe(true);
  });

  test("does not treat preferred Umbre themes as active when auto-detect is off", () => {
    setThemeState({
      colorTheme: "Default Dark Modern",
      preferredDarkColorTheme: "Umbre",
    });

    expect(isUmbreThemeActive()).toBe(false);
    expect(isUmbreThemeConfigured()).toBe(true);
  });
});

const resetTestState = (): void => {
  activeIconTheme = "";
  symbolsInstalled = false;
  themeState = defaultThemeState();
  informationChoices = [];
  informationMessages = [];
  commandCalls = [];
  updatedIconTheme = undefined;
};

const setThemeState = (nextState: Partial<WorkbenchThemeState>): void => {
  themeState = { ...themeState, ...nextState };
};
