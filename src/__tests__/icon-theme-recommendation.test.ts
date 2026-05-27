import { beforeEach, describe, expect, mock, test } from "bun:test";

let activeIconTheme = "";
let symbolsInstalled = false;
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
  extensions: {
    getExtension: (id: string) => (symbolsInstalled && id === "miguelsolorio.symbols" ? { id } : undefined),
  },
  ProgressLocation: {
    Notification: 15,
  },
  window: {
    showInformationMessage: async (message: string) => {
      informationMessages.push(message);
      return informationChoices.shift();
    },
    withProgress: async (_options: unknown, task: () => Promise<unknown>) => task(),
  },
  workspace: {
    getConfiguration: (section: string) => {
      expect(section).toBe("workbench");
      return {
        get: (key: string) => {
          expect(key).toBe("iconTheme");
          return activeIconTheme;
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

describe("Umbre Symbols recommendation", () => {
  beforeEach(() => {
    activeIconTheme = "";
    symbolsInstalled = false;
    informationChoices = [];
    informationMessages = [];
    commandCalls = [];
    updatedIconTheme = undefined;
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
