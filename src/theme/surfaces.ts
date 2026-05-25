import type { DimVariant, Mode, ShadeVariant } from "@/config.ts";
import type { Surfaces } from "@/theme/model-types.ts";
import { black, mix, tw, white, withAlpha } from "@/theme/palette.ts";

type SurfaceLayers = Pick<
  Surfaces,
  "chrome0" | "chrome1" | "chrome2" | "chrome3" | "overlay" | "overlay2" | "raised"
>;

export const createSurfaces = (mode: Mode, shade: ShadeVariant, dim: DimVariant): Surfaces => {
  return mode === "dark" ? createDarkSurfaces(shade, dim) : createLightSurfaces(shade, dim);
};

const createDarkSurfaces = (shade: ShadeVariant, dim: DimVariant): Surfaces => {
  const depth = shadeDepth(shade);
  const uiDim = chromeDimming(dim);
  const bg = shade.level === 5 ? black() : mix(tw("zinc", 900), tw("zinc", 950), 0.18 + depth * 0.72);
  const layers = shade.level === 5 ? createPureBlackLayers(bg, dim) : createDarkLayers(bg, depth, dim);
  const lineBase = mix(tw("zinc", 700), bg, 0.2 + dim.chromeMix + depth * 0.1);
  const lineStrongBase = mix(tw("zinc", 600), bg, 0.18 + dim.chromeMix + depth * 0.1);
  const fg = mix(tw("zinc", 200), tw("zinc", 400), dim.foregroundMix);
  const muted = mix(tw("zinc", 500), tw("zinc", 600), dim.foregroundMix);
  const subtle = mix(tw("zinc", 600), bg, 0.2 + dim.chromeMix + depth * 0.18);

  return {
    bg,
    editor: bg,
    ...layers,
    line: withAlpha(lineBase, 0.32),
    lineStrong: withAlpha(lineStrongBase, 0.42),
    fg,
    muted,
    subtle,
    deemphasized: createDeemphasized(muted, subtle),
    ghost: withAlpha(mix(tw("zinc", 600), bg, 0.22 + depth * 0.18 + uiDim * 0.1), 0.42),
    selection: withAlpha(white(), 0.085 + depth * 0.025 + dim.foregroundMix * 0.08),
    selectionSoft: withAlpha(white(), 0.045 + depth * 0.015 + dim.foregroundMix * 0.06),
    shadow: withAlpha(black(), 0.36),
    inverse: white(),
    isDark: true,
  };
};

const createDarkLayers = (bg: string, depth: number, dim: DimVariant): SurfaceLayers => {
  const dimLayer = (hex: string, strength = 1): string => darkenLayerTowardEditor(hex, bg, dim, strength);

  return {
    chrome0: dimLayer(mix(bg, tw("zinc", 950), 0.34 + depth * 0.12), 1.1),
    chrome1: dimLayer(mix(bg, tw("zinc", 900), 0.22 + (1 - depth) * 0.12)),
    chrome2: dimLayer(mix(bg, tw("zinc", 900), 0.3 + (1 - depth) * 0.12)),
    chrome3: dimLayer(mix(bg, tw("zinc", 800), 0.16 + (1 - depth) * 0.06)),
    overlay: dimLayer(mix(bg, tw("zinc", 800), 0.24 + (1 - depth) * 0.06), 0.8),
    overlay2: dimLayer(mix(bg, tw("zinc", 700), 0.2 + (1 - depth) * 0.06), 0.62),
    raised: dimLayer(mix(bg, tw("zinc", 700), 0.26 + (1 - depth) * 0.08), 0.58),
  };
};

const createPureBlackLayers = (bg: string, dim: DimVariant): SurfaceLayers => {
  const dimLayer = (hex: string, strength = 1): string => darkenLayerTowardEditor(hex, bg, dim, strength);

  return {
    chrome0: dimLayer(mix(bg, tw("zinc", 900), 0.64), 1.1),
    chrome1: dimLayer(mix(bg, tw("zinc", 900), 0.74)),
    chrome2: dimLayer(mix(bg, tw("zinc", 900), 0.78)),
    chrome3: dimLayer(mix(bg, tw("zinc", 800), 0.66)),
    overlay: dimLayer(mix(bg, tw("zinc", 800), 0.66), 0.8),
    overlay2: dimLayer(mix(bg, tw("zinc", 700), 0.58), 0.62),
    raised: dimLayer(mix(bg, tw("zinc", 700), 0.62), 0.58),
  };
};

const createLightSurfaces = (shade: ShadeVariant, dim: DimVariant): Surfaces => {
  const depth = shadeDepth(shade);
  const uiDim = chromeDimming(dim);
  const bg = mix(white(), tw("zinc", 200), depth);
  const layers = createLightLayers(bg, depth, dim);
  const lineBase = mix(tw("zinc", 300), tw("zinc", 500), depth * 0.36 + dim.chromeMix);
  const lineStrongBase = mix(tw("zinc", 400), tw("zinc", 600), depth * 0.34 + dim.chromeMix);
  const fg = mix(tw("zinc", 950), tw("zinc", 700), dim.foregroundMix);
  const muted = mix(tw("zinc", 600), tw("zinc", 500), dim.foregroundMix);
  const subtle = mix(tw("zinc", 500), tw("zinc", 400), dim.foregroundMix);

  return {
    bg,
    editor: bg,
    ...layers,
    line: withAlpha(lineBase, 0.44),
    lineStrong: withAlpha(lineStrongBase, 0.54),
    fg,
    muted,
    subtle,
    deemphasized: createDeemphasized(muted, subtle),
    ghost: withAlpha(tw("zinc", 400), 0.42 - uiDim * 0.06),
    selection: withAlpha(black(), 0.1 + depth * 0.04 + dim.foregroundMix * 0.05),
    selectionSoft: withAlpha(black(), 0.055 + depth * 0.02 + dim.foregroundMix * 0.04),
    shadow: withAlpha(black(), 0.12),
    inverse: black(),
    isDark: false,
  };
};

const createLightLayers = (bg: string, depth: number, dim: DimVariant): SurfaceLayers => {
  const dimLayer = (hex: string, strength = 1): string => darkenLightLayer(hex, bg, depth, dim, strength);

  return {
    chrome0: dimLayer(mix(bg, tw("zinc", 300), 0.12 + depth * 0.1), 0.9),
    chrome1: dimLayer(mix(bg, tw("zinc", 300), 0.08 + depth * 0.08), 0.85),
    chrome2: dimLayer(mix(bg, tw("zinc", 300), 0.12 + depth * 0.1)),
    chrome3: dimLayer(mix(bg, tw("zinc", 300), 0.16 + depth * 0.12), 1.08),
    overlay: dimLayer(mix(bg, white(), 0.82 - depth * 0.22), 0.95),
    overlay2: dimLayer(mix(bg, tw("zinc", 300), 0.1 + depth * 0.12), 0.86),
    raised: dimLayer(mix(mix(bg, white(), 0.82 - depth * 0.22), tw("zinc", 300), 0.24 + depth * 0.1), 0.75),
  };
};

const darkenLayerTowardEditor = (hex: string, bg: string, dim: DimVariant, strength: number): string => {
  return mix(hex, bg, chromeDimming(dim) * 0.48 * strength);
};

const darkenLightLayer = (
  hex: string,
  bg: string,
  depth: number,
  dim: DimVariant,
  strength: number,
): string => {
  const target = mix(bg, tw("zinc", 300), 0.22 + depth * 0.16);
  return mix(hex, target, chromeDimming(dim) * 0.62 * strength);
};

const createDeemphasized = (muted: string, subtle: string): string => mix(muted, subtle, 0.58);

const chromeDimming = (dim: DimVariant): number => (dim.level - 1) / 4;

const shadeDepth = (shade: ShadeVariant): number => (shade.level - 1) / 4;
