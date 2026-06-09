import { describe, expect, test } from "bun:test";

import { commandIds } from "@/product.ts";
import { activeThemeWhenClause, createExtensionManifest } from "@scripts/build/artifacts.ts";
import { createThemes } from "@scripts/build/themes.ts";

describe("Umbre extension manifest", () => {
  test("hides command palette settings until Umbre is selected", () => {
    const manifest = createExtensionManifest(
      {
        name: "umbre-theme",
        displayName: "Umbre",
        description: "A quiet theme.",
        version: "0.0.0",
        publisher: "ohkimur",
        license: "Apache-2.0",
        repository: {
          type: "git",
          url: "https://github.com/ohkimur/umbre-theme.git",
        },
      },
      createThemes(),
    );

    expect(manifest.contributes.menus.commandPalette).toEqual([
      {
        command: commandIds.configure,
        when: activeThemeWhenClause,
      },
      {
        command: commandIds.toggleOpposite,
        when: activeThemeWhenClause,
      },
      {
        command: commandIds.chooseFont,
        when: activeThemeWhenClause,
      },
    ]);
  });
});
