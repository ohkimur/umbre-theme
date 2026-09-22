/**
 * VS Code's Markdown diff marks changed text by inserting empty `<span data-diff-start|end>` tags into
 * the source, then highlights the text between each pair. Code is escaped, so inside fences and inline
 * code those tags show as text, and a tag inside Markdown syntax breaks it (a fence, heading, table
 * row, or link then renders as plain text).
 *
 * Only a diff render is changed: VS Code parses before it knows, so the diff render parses the source
 * again with the markers moved clear of Markdown syntax, and code puts them back as real, empty
 * elements so changes stay highlighted. Each changed block must render exactly as it would without
 * markers; a block that doesn't loses its markers, so rendering never breaks. Ordinary previews render
 * exactly as before.
 */

type Marker = { offset: number; html: string };
type Token = {
  type: string;
  info: string;
  content: string;
  markup?: string;
  map?: [number, number] | null;
  meta?: unknown;
  children?: Token[] | null;
};
/** `umbreLift` parses an already placed diff source: markers are lifted out of code, and nothing else. */
type Env = { umbreLift?: boolean; currentDocument?: unknown };
type CodeRule = (tokens: Token[], index: number, options: unknown, env: unknown, renderer: unknown) => string;
type CoreRule = (state: { src: string; tokens: Token[]; env: unknown }) => void;
export type MarkdownItWithCore = {
  parse: (src: string, env: unknown) => Token[];
  block: { parse: (src: string, md: unknown, env: object, tokens: Token[]) => void };
  core: {
    ruler: {
      before: (name: string, rule: string, fn: CoreRule) => void;
      push: (rule: string, fn: CoreRule) => void;
    };
  };
  renderer: {
    rules: Record<string, CodeRule | undefined>;
    render: (tokens: Token[], options: unknown, env: unknown) => string;
  };
};

const markerPattern = /<span data-diff-(?:start|end)="\d+"><\/span>/g;
const codeTokens = ["fence", "code_block", "code_inline"];
const leafBlocks = [
  "paragraph_open",
  "heading_open",
  "table_open",
  "fence",
  "code_block",
  "html_block",
  "hr",
];

/** Quote markers and indentation in front of a block. */
const quotePrefix = /^(?:[ \t]*>)*[ \t]*/;

/** The quote markers of `depth` enclosing quotes, then indentation, which code keeps in front of any marker. */
const codePrefix = (line: string, depth: number): number =>
  new RegExp(`^(?:[ \\t]*>){${depth}}[ \\t]*`).exec(line)?.[0].length ?? 0;

/** Indentation plus quote, list, task, and heading markers that must start a line for Markdown to see them. */
const blockPrefix =
  /^[ \t]*(?:(?:>[ \t]?|[-*+][ \t]+|\d{1,9}[.)][ \t]+|\[[ xX]\][ \t]+|#{1,6}[ \t]+)[ \t]*)*/;

/** Lines that are only syntax: thematic breaks, setext underlines, and table delimiter rows. */
const syntaxOnlyLine = /^(?:(?:[-*_][ \t]*){3,}|=+|\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?)[ \t]*$/;

export const extractDiffMarkers = (text: string): { text: string; markers: Marker[] } => {
  const markers: Marker[] = [];
  let removed = 0;
  const clean = text.replace(markerPattern, (html: string, index: number) => {
    markers.push({ offset: index - removed, html });
    removed += html.length;
    return "";
  });
  return { text: clean, markers };
};

/** Puts each marker back into `text` at the position `at` chooses for it, keeping their order. */
const placeAt = (text: string, markers: Marker[], at: (marker: Marker) => number): string => {
  const placed = markers.map((marker, index) => ({ ...marker, index, at: at(marker) }));
  placed.sort((a, b) => a.at - b.at || a.index - b.index);
  let output = "";
  let from = 0;
  for (const { at: position, html } of placed) {
    output += text.slice(from, position) + html;
    from = position;
  }
  return output + text.slice(from);
};

type BlockContext = {
  code: Map<number, number>;
  delimiters: Set<number>;
  rows: Set<number>;
  headings: Set<number>;
  leaves: [number, number][];
};

/**
 * What markdown-it makes of each source line without markers: code or raw HTML (with where its content
 * starts), fence delimiters (closure comes from the lines the parser consumed), table rows, ATX
 * headings, and the leaf blocks that changes are checked against.
 */
const blockContext = (tokens: Token[], lines: string[]): BlockContext => {
  const context: BlockContext = {
    code: new Map(),
    delimiters: new Set(),
    rows: new Set(),
    headings: new Set(),
    leaves: [],
  };
  let quotes = 0;
  for (const token of tokens) {
    if (token.type === "blockquote_open") quotes += 1;
    if (token.type === "blockquote_close") quotes -= 1;
    if (!token.map) continue;
    const [first, next] = token.map;
    const range = (from: number, to: number): number[] =>
      Array.from({ length: Math.max(to - from, 0) }, (_, i) => from + i);
    if (leafBlocks.includes(token.type) || token.type.includes("front_matter"))
      context.leaves.push([first, next]);

    if (token.type === "fence") {
      const contentLines = token.content ? token.content.replace(/\n$/, "").split("\n").length : 0;
      const closed = next - first - 1 > contentLines;
      context.delimiters.add(first);
      if (closed) context.delimiters.add(next - 1);
      for (const line of range(first + 1, closed ? next - 1 : next))
        context.code.set(line, codePrefix(lines[line] ?? "", quotes));
    } else if (
      token.type === "code_block" ||
      token.type === "html_block" ||
      token.type.includes("front_matter")
    ) {
      for (const line of range(first, next)) context.code.set(line, codePrefix(lines[line] ?? "", quotes));
    } else if (token.type === "table_open") {
      for (const line of range(first, next)) context.rows.add(line);
    } else if (token.type === "heading_open" && token.markup?.startsWith("#")) {
      context.headings.add(first);
    }
  }
  return context;
};

/** Where a marker goes in a prose line: past block markers, inside table cells, before a heading's closing `#`s. */
const prosePosition = (text: string, index: number, context: BlockContext) => {
  const start = blockPrefix.exec(text)?.[0].length ?? 0;
  const closer = context.headings.has(index) ? /[ \t]+#+[ \t]*$/.exec(text)?.index : undefined;
  return ({ offset, html }: Marker): number => {
    let at = Math.max(offset, start);
    const opens = html.includes("data-diff-start");
    if (context.rows.has(index)) {
      if (opens) while (/[ \t|]/.test(text[at] ?? "")) at += 1;
      else while (at > start && /[ \t|]/.test(text[at - 1] ?? "")) at -= 1;
    }
    if (closer !== undefined && !opens) at = Math.min(at, closer);
    return at;
  };
};

type DiffTools = {
  parseBlocks: (source: string) => Token[];
  /** Whether `marked` renders exactly like `plain` once its markers are removed. */
  rendersLike: (marked: string, plain: string) => boolean;
};

/**
 * Moves markers clear of Markdown syntax, using the block structure markdown-it finds without them.
 * Fence delimiters and syntax-only lines lose theirs (they render no text), code keeps them after its
 * indentation, and prose keeps them outside block and table syntax. A leaf block that still renders
 * differently with its markers loses them.
 */
export const placeDiffMarkers = (
  source: string,
  { parseBlocks, rendersLike }: DiffTools,
  prose = true,
): string => {
  const lines = source.split("\n");
  const stripped = lines.map((line) => line.replace(markerPattern, ""));
  const context = blockContext(parseBlocks(stripped.join("\n")), stripped);

  const placed = lines.map((line, index) => {
    if (!line.includes("data-diff-")) return line;
    const { text, markers } = extractDiffMarkers(line);
    if (context.delimiters.has(index)) return text;
    const codeStart = context.code.get(index);
    if (codeStart !== undefined) return placeAt(text, markers, ({ offset }) => Math.max(offset, codeStart));
    if (!prose || syntaxOnlyLine.test(text.replace(quotePrefix, ""))) return text;
    return placeAt(text, markers, prosePosition(text, index, context));
  });

  // Check each changed leaf block (or a lone line outside one) on its own. Leaf blocks never nest.
  const leafOf = new Map<number, [number, number]>();
  for (const leaf of context.leaves) for (let line = leaf[0]; line < leaf[1]; line++) leafOf.set(line, leaf);
  const checked = new Set<number>();
  placed.forEach((line, index) => {
    const [first, next] = leafOf.get(index) ?? [index, index + 1];
    if (line === stripped[index] || checked.has(first)) return;
    checked.add(first);
    if (!rendersLike(placed.slice(first, next).join("\n"), stripped.slice(first, next).join("\n"))) {
      for (let line = first; line < next; line++) placed[line] = stripped[line] ?? "";
    }
  });
  return placed.join("\n");
};

/**
 * Inserts markers before the text character at each offset; an HTML entity counts as one character.
 * Markers past the end of the code stay right after its last character, inside the code element.
 */
export const insertDiffMarkers = (html: string, markers: Marker[], textLength = Infinity): string => {
  let output = "";
  let offset = 0;
  let afterText = 0;
  let next = 0;
  for (const [unit] of html.matchAll(/<[^>]*>|&(?:#\d+|#x[\da-f]+|[a-z][a-z\d]*);|[\s\S]/gi)) {
    if (!unit.startsWith("<")) {
      while (offset < textLength && next < markers.length && (markers[next]?.offset ?? 0) <= offset) {
        output += markers[next++]?.html;
      }
      offset += 1;
    }
    output += unit;
    if (!unit.startsWith("<") && offset <= textLength) afterText = output.length;
  }
  const rest = markers
    .slice(next)
    .map((marker) => marker.html)
    .join("");
  return output.slice(0, afterText) + rest + output.slice(afterText);
};

type DiffMeta = { umbreDiffMarkers?: Marker[] };

const liftMarkers = (token: Token): void => {
  const meta = token.meta as ({ content?: unknown } & DiffMeta) | null | undefined;
  // Front matter keeps its source in `meta.content` and renders it as a table; markers can't map there.
  if (typeof meta?.content === "string" && meta.content.includes("data-diff-")) {
    token.meta = { ...meta, content: meta.content.replace(markerPattern, "") };
  }
  if (!codeTokens.includes(token.type) || !token.content.includes("data-diff-")) return;
  const { text, markers } = extractDiffMarkers(token.content);
  token.meta = { ...(token.meta as object | null), umbreDiffMarkers: markers };
  token.content = text;
  token.info = token.info.replace(markerPattern, "");
};

/** VS Code renders diffs from text rather than a document, so only a diff render has no current document. */
const isDiffRender = (env: unknown): boolean => (env as Env | null)?.currentDocument === undefined;
const isLiftParse = (env: unknown): boolean => (env as Env | null)?.umbreLift === true;

export const umbreDiffMarkers = <T extends MarkdownItWithCore>(md: T, isActive: () => boolean): T => {
  const sources = new WeakMap<Token[], string>();
  const render = md.renderer.render.bind(md.renderer);

  // Record the source on the final token list: plugins such as footnotes replace `state.tokens`.
  const parse = md.parse.bind(md);
  md.parse = (src, env) => {
    const tokens = parse(src, env);
    if (src.includes("data-diff-") && !isLiftParse(env)) sources.set(tokens, src);
    return tokens;
  };

  const parseBlocks = (source: string): Token[] => {
    const tokens: Token[] = [];
    md.block.parse(source, md, {}, tokens);
    return tokens;
  };

  md.core.ruler.push("umbre_diff_code", (state) => {
    if (!isLiftParse(state.env)) return;
    for (const token of state.tokens) {
      liftMarkers(token);
      for (const child of token.children ?? []) liftMarkers(child);
    }
  });

  md.renderer.render = (tokens, options, env) => {
    const source = sources.get(tokens);
    if (source === undefined || !isActive() || !isDiffRender(env)) return render(tokens, options, env);

    // The whole document must render as it would without markers, since links and footnotes refer
    // across blocks. Otherwise keep only the markers in code, and failing that, none.
    const plain = source.replace(markerPattern, "");
    const expected = render(md.parse(plain, {}), options, {});
    const tools: DiffTools = {
      parseBlocks,
      rendersLike: (marked, unmarked) =>
        render(md.parse(marked, { umbreLift: true }), options, {}).replace(markerPattern, "") ===
        render(md.parse(unmarked, {}), options, {}),
    };
    for (const prose of [true, false]) {
      const placed = placeDiffMarkers(source, tools, prose);
      const rendered = render(md.parse(placed, { umbreLift: true }), options, {});
      // Output comes from a fresh parse: rendering mutates tokens (image sources, heading ids).
      if (rendered.replace(markerPattern, "") === expected)
        return render(md.parse(placed, { umbreLift: true }), options, env);
    }
    return render(md.parse(plain, {}), options, env);
  };

  for (const name of codeTokens) {
    const rule = md.renderer.rules[name];
    if (!rule) continue;
    md.renderer.rules[name] = (tokens, index, options, env, renderer) => {
      const html = rule(tokens, index, options, env, renderer);
      const markers = (tokens[index]?.meta as DiffMeta | null | undefined)?.umbreDiffMarkers;
      return markers?.length ? insertDiffMarkers(html, markers, tokens[index]?.content.length) : html;
    };
  }
  return md;
};
