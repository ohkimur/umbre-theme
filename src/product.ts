export const product = {
  displayName: "Umbre",
  themeFilePrefix: "umbre",
  settingsStorageKey: "umbre.themeSettings",
  recommendedExtensions: {
    symbols: {
      id: "miguelsolorio.symbols",
      name: "Symbols",
      pitch: "a simple file icon theme",
      iconThemeId: "symbols",
      url: "https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols",
    },
    githubMarkdownPreview: {
      id: "bierner.github-markdown-preview",
      // The pack installs this styling extension, which is what changes the preview.
      checkId: "bierner.markdown-preview-github-styles",
      name: "GitHub Markdown Preview",
      pitch: "GitHub-style Markdown previews in your palette",
      url: "https://marketplace.visualstudio.com/items?itemName=bierner.github-markdown-preview",
    },
    markdownHighlighting: {
      id: "bierner.markdown-shiki",
      name: "Markdown Preview VS Code Highlighting",
      pitch: "which colors preview code blocks exactly like the editor",
      url: "https://marketplace.visualstudio.com/items?itemName=bierner.markdown-shiki",
    },
  },
  commands: {
    configure: {
      id: "umbre.configure",
      title: "Configure Theme",
    },
    toggleOpposite: {
      id: "umbre.toggleOpposite",
      title: "Toggle Opposite Mode",
    },
    chooseFont: {
      id: "umbre.chooseFont",
      title: "Choose Font",
    },
  },
} as const;

export const commandIds = {
  configure: product.commands.configure.id,
  toggleOpposite: product.commands.toggleOpposite.id,
  chooseFont: product.commands.chooseFont.id,
} as const;
