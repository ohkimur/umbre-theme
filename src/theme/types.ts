export type ColorMap = Record<string, string>;

export type ThemeContribution = {
  id: string;
  label: string;
  uiTheme: "vs" | "vs-dark";
  path: string;
  _watch?: boolean;
};

export type TokenColor = {
  name?: string;
  scope?: string | string[];
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
};

export type SemanticTokenColor =
  | string
  | {
      foreground: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };

export type ThemeDocument = {
  name: string;
  type: "dark" | "light";
  semanticHighlighting: true;
  colors: ColorMap;
  tokenColors: TokenColor[];
  semanticTokenColors: Record<string, SemanticTokenColor>;
};

export type BuiltTheme = {
  contribution: ThemeContribution;
  document: ThemeDocument;
  fileName: string;
};
