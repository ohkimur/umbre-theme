export const product = {
  displayName: "Umbre",
  themeFilePrefix: "umbre",
  settingsStorageKey: "umbre.themeSettings",
  commands: {
    configure: {
      id: "umbre.configure",
      title: "Configure Theme",
    },
    toggleMode: {
      id: "umbre.toggleMode",
      title: "Configure Opposite Theme",
    },
  },
} as const;

export const commandIds = {
  configure: product.commands.configure.id,
  toggleMode: product.commands.toggleMode.id,
} as const;
