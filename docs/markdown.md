# Markdown in Umbre

How Umbre styles Markdown, and the differences between Markdown surfaces that remain.
Check changes against [`samples/markdown-check.md`](../samples/markdown-check.md) in pure black first, then light.

## How it works

| Surface                            | Styled by                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Markdown source                    | Token colors in `src/theme/tokens/markup.ts`, reusing the Markdown roles                                                                   |
| Built-in preview                   | `assets/markdown-preview.css`, reading theme colors                                                                                        |
| GitHub Markdown Preview (optional) | The same stylesheet, which points GitHub's palette at Umbre's                                                                              |
| Markdown editor (rich view)        | VS Code's `text*` workbench colors only; it does not load preview styles                                                                   |
| Mermaid in previews                | VS Code's `vscode` Mermaid theme, which reads workbench colors (`editorWidget.*`, `chart.line`, `charts.*`, `textBlockQuote.*`, `input.*`) |
| Mermaid source                     | `assets/grammars/`, colored by Umbre's existing token rules                                                                                |

Shared roles (links, inline code, code blocks, quotes, separators) live on VS Code's `text*` colors in `src/theme/markdown.ts`, so every surface agrees. Everything else is an `umbreMarkdown.*` color.

## Known differences

These come from VS Code's renderers, not Umbre. A theme cannot change them.

| Where                | Difference                                                                                             | Why                                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Markdown editor      | Mermaid uses pale default colors; labels and arrows can be hard to read on dark themes                 | The editor initializes Mermaid with `theme: 'default'` and ignores theme colors                                                                              |
| Markdown editor      | Diagrams sit inside a full-width code-block frame                                                      | Editor layout                                                                                                                                                |
| Markdown editor      | Directory trees and code are colored by the editor's tokenizer                                         | Previews use highlight.js unless _Markdown Preview VS Code Highlighting_ is installed                                                                        |
| Markdown editor diff | Added blocks show as raw Markdown source                                                               | Diff rendering                                                                                                                                               |
| Mermaid in previews  | Sequence numbers and activation bars take their colors from line and input colors                      | The `vscode` Mermaid theme has no separate variables for them                                                                                                |
| Mermaid in previews  | Zoom controls can cover the top of a diagram; label size and spacing are Mermaid's                     | Viewer and Mermaid layout                                                                                                                                    |
| Mermaid in previews  | Wide diagrams, such as long left-to-right flowcharts, shrink to fit, so labels get small               | Mermaid scales diagrams to the pane width; the viewer exposes no setting for it                                                                              |
| Mermaid in previews  | The mindmap root can show dark text on a charcoal node                                                 | Mermaid colors the root from its git palette (`git0`, `gitBranchLabel0`), which the `vscode` theme does not set                                              |
| Mermaid in previews  | After a theme switch, open previews re-render: open `<details>` close and the scroll position can move | VS Code's Mermaid preview only re-reads theme colors on a full render, so Umbre refreshes previews after a theme change to keep diagrams in the right colors |

Tip: to keep a wide diagram at full size and scroll it instead, start it with
`%%{init: {"flowchart": {"useMaxWidth": false}}}%%` (or the matching key for other diagram types).
