import type { ThemeModel } from "@/theme/model.ts";
import { withAlpha } from "@/theme/palette.ts";
import { tokenRule } from "@/theme/token-rule.ts";
import type { TokenColor } from "@/theme/types.ts";

export const codeTokenColors = ({ syntax }: ThemeModel): TokenColor[] => [
  tokenRule(
    "Types",
    [
      "entity.name.type",
      "entity.other.inherited-class",
      "support.type",
      "support.class",
      "source.go storage.type",
    ],
    syntax.type,
  ),
  tokenRule("Classes", ["entity.name.class", "entity.name.struct", "support.class.component"], syntax.class),
  tokenRule("Interfaces", ["entity.name.interface"], syntax.interface),
  tokenRule("Function Name", ["entity.name.function", "support.function", "support.macro"], syntax.function),
  tokenRule(
    "Function Call",
    ["variable.function", "meta.function-call.generic", "support.function.go"],
    syntax.method,
  ),
  tokenRule("Function Arguments", ["variable.parameter", "meta.parameter"], syntax.parameter),
  tokenRule("Imports and Packages", ["entity.name.import", "entity.name.package"], syntax.string),
  tokenRule("Entity Name", ["entity.name"], syntax.class),
  tokenRule("Tag", ["entity.name.tag", "meta.tag.sgml"], syntax.tag),
  tokenRule(
    "Tag Delimiters",
    ["punctuation.definition.tag.end", "punctuation.definition.tag.begin", "punctuation.definition.tag"],
    withAlpha(syntax.tag, 0.55),
  ),
  tokenRule("Tag Attribute", ["entity.other.attribute-name"], syntax.attribute),
  tokenRule("CSS Pseudo Class", ["entity.other.attribute-name.pseudo-class"], syntax.regexp),
  tokenRule(
    "Decorators",
    [
      "meta.decorator variable.other",
      "meta.decorator punctuation.decorator",
      "storage.type.annotation",
      "entity.name.function.decorator",
    ],
    syntax.special,
  ),
  tokenRule("CSS Properties", ["support.type.property-name"], syntax.tag),
  tokenRule(
    "CSS Browser Prefix",
    [
      "source.css support.type",
      "source.sass support.type",
      "source.scss support.type",
      "source.less support.type",
      "source.stylus support.type",
    ],
    syntax.comment,
  ),
];
