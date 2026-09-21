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
let installedExtensions = new Set<string>();
let disabledExtensions = new Set<string>();
let remoteName: string | undefined;

type MockUri = { path: string; with: (change: { path: string }) => MockUri; toString: () => string };
const mockUri = (path: string): MockUri => ({
  path,
  with: ({ path: next }) => mockUri(next),
  toString: () => path,
});
let themeState: WorkbenchThemeState = defaultThemeState();
let informationChoices: (string | undefined)[] = [];
let informationMessages: string[] = [];
let commandCalls: unknown[][] = [];
let updatedIconTheme: string | undefined;

mock.module("vscode", () => ({
  commands: {
    executeCommand: async (...args: unknown[]) => {
      commandCalls.push(args);
      if (args[0] === "workbench.extensions.installExtension") {
        installedExtensions.add(String(args[1]));
        if (args[1] === "miguelsolorio.symbols") symbolsInstalled = true;
      }
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
  env: {
    get remoteName() {
      return remoteName;
    },
  },
  Uri: {
    joinPath: (base: MockUri, ...parts: string[]) => mockUri([base.path, ...parts].join("/")),
  },
  extensions: {
    all: [{ packageJSON: {}, extensionUri: mockUri("/extensions/ohkimur.umbre-theme") }],
    getExtension: (id: string) =>
      (symbolsInstalled && id === "miguelsolorio.symbols") || installedExtensions.has(id)
        ? { id }
        : undefined,
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
    fs: {
      readFile: async (uri: MockUri) => {
        expect(uri.path).toBe("/extensions/extensions.json");
        const records = [...disabledExtensions].map((id) => ({ identifier: { id } }));
        return new TextEncoder().encode(JSON.stringify(records));
      },
    },
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
const { recommendExtension, resetRecommendationsForTests } =
  await import("@/runtime/extension-recommendation.ts");
const { product } = await import("@/product.ts");
const { isUmbreThemeActive, isUmbreThemeConfigured } = await import("@/runtime/active-theme.ts");

let profilePath = "/User/globalStorage/ohkimur.umbre-theme";
const context = {
  get globalStorageUri() {
    return mockUri(profilePath);
  },
} as unknown as import("vscode").ExtensionContext;

describe("Umbre Symbols recommendation", () => {
  beforeEach(() => {
    resetTestState();
    resetSymbolsIconThemePromptForTests();
    resetRecommendationsForTests();
  });

  test("installs Symbols and applies it from Cursor notifications", async () => {
    informationChoices = ["Install Symbols", "Use Symbols"];

    await suggestSymbolsIconTheme(context);

    expect(informationMessages).toEqual([
      "Umbre pairs well with Symbols, a simple file icon theme.",
      "Symbols is ready. Use it as your file icon theme?",
    ]);
    expect(commandCalls).toEqual([["workbench.extensions.installExtension", "miguelsolorio.symbols"]]);
    expect(updatedIconTheme).toBe("symbols");
  });

  test("does not keep a permanent dismissal across sessions", async () => {
    informationChoices = ["Not now"];
    await suggestSymbolsIconTheme(context);
    await suggestSymbolsIconTheme(context);

    expect(informationMessages).toHaveLength(1);

    resetRecommendationsForTests();
    informationChoices = ["Not now"];
    await suggestSymbolsIconTheme(context);

    expect(informationMessages).toHaveLength(2);
  });

  test("offers to use Symbols when it is already enabled", async () => {
    symbolsInstalled = true;
    informationChoices = ["Use Symbols"];

    await suggestSymbolsIconTheme(context);

    expect(informationMessages).toEqual(["Symbols is ready. Use it as your file icon theme?"]);
    expect(updatedIconTheme).toBe("symbols");
  });

  test("skips the recommendation when Symbols is already active", async () => {
    activeIconTheme = "symbols";

    await suggestSymbolsIconTheme(context);

    expect(informationMessages).toHaveLength(0);
    expect(commandCalls).toHaveLength(0);
    expect(updatedIconTheme).toBeUndefined();
  });
});

describe("Umbre extension recommendations", () => {
  const markdownPreview = product.recommendedExtensions.githubMarkdownPreview;

  beforeEach(() => {
    resetTestState();
    resetRecommendationsForTests();
  });

  test("installs a missing extension when accepted", async () => {
    informationChoices = ["Install GitHub Markdown Preview"];

    expect(await recommendExtension(context, markdownPreview)).toBe("installed");
    expect(informationMessages).toEqual([
      "Umbre pairs well with GitHub Markdown Preview, GitHub-style Markdown previews in your palette.",
    ]);
    expect(commandCalls).toEqual([
      ["workbench.extensions.installExtension", "bierner.github-markdown-preview"],
    ]);
  });

  test("asks to enable an installed but disabled extension", async () => {
    disabledExtensions.add("bierner.markdown-preview-github-styles");
    informationChoices = ["Enable GitHub Markdown Preview"];

    await recommendExtension(context, markdownPreview);

    expect(informationMessages).toEqual([
      "GitHub Markdown Preview is installed but disabled. Enable it to use it with Umbre.",
    ]);
    expect(commandCalls).toEqual([["extension.open", "bierner.markdown-preview-github-styles"]]);
  });

  test("checks the extension that does the work, not just its pack", async () => {
    installedExtensions.add("bierner.github-markdown-preview");
    informationChoices = ["Not now"];

    await recommendExtension(context, markdownPreview);

    expect(informationMessages).toHaveLength(1);
  });

  test("counts opening the extension page as this session's offer", async () => {
    remoteName = "ssh-remote";
    informationChoices = ["Show GitHub Markdown Preview"];
    await recommendExtension(context, markdownPreview);
    await recommendExtension(context, markdownPreview);

    expect(informationMessages).toHaveLength(1);
  });

  test("only asks once per session after dismissal", async () => {
    informationChoices = ["Not now"];
    await recommendExtension(context, markdownPreview);
    await recommendExtension(context, markdownPreview);

    expect(informationMessages).toHaveLength(1);
  });

  for (const [label, setup] of [
    ["remote windows", () => (remoteName = "ssh-remote")],
    ["non-default profiles", () => (profilePath = "/User/profiles/abc/globalStorage/ohkimur.umbre-theme")],
  ] as const) {
    test(`opens the extension page in ${label} instead of guessing`, async () => {
      setup();
      informationChoices = ["Show GitHub Markdown Preview"];

      await recommendExtension(context, markdownPreview);

      expect(commandCalls).toEqual([["extension.open", "bierner.github-markdown-preview"]]);
    });
  }

  test("stays quiet when the extension is already enabled", async () => {
    installedExtensions.add("bierner.markdown-preview-github-styles");

    expect(await recommendExtension(context, markdownPreview)).toBe("enabled");
    expect(informationMessages).toHaveLength(0);
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
  installedExtensions = new Set();
  disabledExtensions = new Set();
  remoteName = undefined;
  profilePath = "/User/globalStorage/ohkimur.umbre-theme";
  themeState = defaultThemeState();
  informationChoices = [];
  informationMessages = [];
  commandCalls = [];
  updatedIconTheme = undefined;
};

const setThemeState = (nextState: Partial<WorkbenchThemeState>): void => {
  themeState = { ...themeState, ...nextState };
};
