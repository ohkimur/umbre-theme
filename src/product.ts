export const product = {
  displayName: "Umbre",
  themeFilePrefix: "umbre",
  settingsStorageKey: "umbre.themeSettings",
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
