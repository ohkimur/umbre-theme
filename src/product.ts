export const product = {
  displayName: "Umbre",
  themeFilePrefix: "umbre",
  settingsStorageKey: "umbre.themeSettings",
  recommendedExtensions: {
    symbols: {
      id: "miguelsolorio.symbols",
      name: "Symbols",
      iconThemeId: "symbols",
      promptStorageKey: "umbre.symbolsIconThemePromptDismissed",
      url: "https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols",
    },
  },
  commands: {
    configure: {
      id: "umbre.configure",
      title: "Configure Theme",
    },
  },
} as const;

export const commandIds = {
  configure: product.commands.configure.id,
} as const;
