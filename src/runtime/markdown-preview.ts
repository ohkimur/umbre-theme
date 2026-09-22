import { umbreDiffMarkers, type MarkdownItWithCore } from "@/markdown/diff-markers.ts";
import { umbreFileTrees } from "@/markdown/file-tree.ts";
import { isUmbreThemeActive } from "@/runtime/active-theme.ts";
import * as vscode from "vscode";

/** Called by VS Code's Markdown extension through `markdown.markdownItPlugins`. */
export const extendMarkdownIt = (md: MarkdownItWithCore): MarkdownItWithCore =>
  umbreDiffMarkers(umbreFileTrees(md, isUmbreThemeActive), isUmbreThemeActive);

/**
 * Markdown previews repaint most colors live, but Mermaid bakes the theme into each diagram when it
 * renders. Re-render open previews after a color theme change (Umbre presets and mode switches rewrite
 * the theme) so diagrams, and Umbre-only rendering like directory trees, follow.
 */
export const initializeMarkdownPreview = (context: vscode.ExtensionContext): void => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme(() => {
      clearTimeout(timer);
      // Webviews receive the new theme colors asynchronously; re-render once they have arrived.
      timer = setTimeout(refreshOpenPreviews, themeSettleDelayMs);
    }),
    { dispose: () => clearTimeout(timer) },
  );
};

const themeSettleDelayMs = 300;

const refreshOpenPreviews = (): void => {
  if (!hasOpenMarkdownPreview()) return;
  void Promise.resolve(vscode.commands.executeCommand("markdown.preview.refresh")).catch(() => undefined);
};

/**
 * Side previews are webview tabs; "Reopen Editor With… > Markdown Preview" is a custom editor
 * (`vscode.markdown.preview.editor`). Both carry a `viewType` naming the markdown preview.
 */
const hasOpenMarkdownPreview = (): boolean =>
  vscode.window.tabGroups.all.some((group) =>
    group.tabs.some(
      (tab) =>
        (tab.input instanceof vscode.TabInputWebview || tab.input instanceof vscode.TabInputCustom) &&
        tab.input.viewType.includes("markdown.preview"),
    ),
  );
