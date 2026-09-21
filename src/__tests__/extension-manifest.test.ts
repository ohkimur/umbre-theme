import { describe, expect, test } from "bun:test";

import { commandIds } from "@/product.ts";
import { activeThemeWhenClause, createExtensionManifest } from "@scripts/build/artifacts.ts";
import { createThemes } from "@scripts/build/themes.ts";

const createManifest = () =>
  createExtensionManifest(
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

describe("Umbre extension manifest", () => {
  test("hides command palette settings until Umbre is selected", () => {
    const manifest = createManifest();

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

  test("styles the Markdown preview without bundling other extensions", () => {
    const manifest = createManifest();

    expect(manifest.contributes["markdown.previewStyles"]).toEqual(["./assets/markdown-preview.css"]);
    expect(manifest).not.toHaveProperty("extensionPack");
  });
});
