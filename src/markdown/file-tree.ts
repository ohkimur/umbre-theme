/**
 * Colors `tree`-style directory listings in Markdown previews. Plain fences have no highlighting,
 * so guides, folders, files, and trailing `# comments` get classes the preview stylesheet colors.
 */

type Token = { type: string; info: string; content: string; map: [number, number] | null };
type FenceRule = (
  tokens: Token[],
  index: number,
  options: unknown,
  env: unknown,
  renderer: unknown,
) => string;
export type MarkdownIt = { renderer: { rules: Record<string, FenceRule | undefined> } };

const treeLanguages = new Set(["", "text", "txt", "plaintext", "bash", "sh", "shell", "tree"]);
const branch = /^[\t │]*[├└]──[ \t]+\S/u;
const htmlEscapes: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

const escapeHtml = (value: string): string => value.replace(/[&<>"]/g, (char) => htmlEscapes[char] ?? char);

/** A listing whose lines are all tree branches, guides, blanks, or a leading root folder. */
export const isFileTree = (code: string, language: string): boolean => {
  if (!treeLanguages.has(language.toLowerCase())) return false;

  const lines = code.trimEnd().split("\n");
  return (
    lines.filter((line) => branch.test(line)).length >= 2 &&
    lines.every(
      (line, index) =>
        !line.trim() ||
        /^[\s│]+$/u.test(line) ||
        branch.test(line) ||
        (index === 0 && /^[^#\s][^#]*\/\s*(#.*)?$/.test(line)),
    )
  );
};

export const highlightFileTree = (code: string): string =>
  code
    .trimEnd()
    .split("\n")
    .map((line) => {
      const [, guide = "", rest = ""] = /^([\t │]*(?:[├└]──[ \t]+)?)(.*)$/u.exec(line) ?? [];
      const [, entry = "", gap = "", comment = ""] = /^(.*?)(\s*)(#.*)?$/u.exec(rest) ?? [];
      const kind = entry.endsWith("/") ? "folder" : "file";
      return [
        guide && `<span class="umbre-tree-guide">${escapeHtml(guide)}</span>`,
        entry && `<span class="umbre-tree-${kind}">${escapeHtml(entry)}</span>`,
        escapeHtml(gap),
        comment && `<span class="umbre-tree-comment">${escapeHtml(comment)}</span>`,
      ].join("");
    })
    .join("\n");

export const umbreFileTrees = <T extends MarkdownIt>(md: T, isActive: () => boolean): T => {
  const fence = md.renderer.rules.fence;
  if (!fence) return md;

  md.renderer.rules.fence = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const language = token?.info.trim().split(/\s+/)[0] ?? "";
    if (!token || !isActive() || !isFileTree(token.content, language)) {
      return fence(tokens, index, options, env, renderer);
    }
    // `code-line` and `data-line` keep the preview's scroll sync for the replaced block.
    const line = token.map ? ` data-line="${token.map[0]}"` : "";
    return `<pre class="umbre-file-tree code-line"${line}><code>${highlightFileTree(token.content)}</code></pre>\n`;
  };
  return md;
};
