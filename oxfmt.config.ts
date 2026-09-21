import { defineConfig } from "oxfmt";

export default defineConfig({
  arrowParens: "always",
  // The Markdown check fixture keeps deliberate edge cases (trailing spaces, odd spacing) unformatted.
  ignorePatterns: ["dist/**", "node_modules/**", "*.vsix", "samples/markdown-check.md"],
  printWidth: 110,
  semi: true,
  singleQuote: false,
  sortImports: {
    internalPattern: ["@/**"],
    groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "style", "unknown"],
  },
  trailingComma: "all",
});
