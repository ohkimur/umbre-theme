import type { Mode, PanelVariant, ShadeVariant } from "@/config.ts";
import type { Surfaces } from "@/theme/model-types.ts";
import { black, mix, tw, white, withAlpha } from "@/theme/palette.ts";

type SurfaceLayers = Pick<
  Surfaces,
  "chrome0" | "chrome1" | "chrome2" | "chrome3" | "overlay" | "overlay2" | "raised"
>;

export const createSurfaces = (mode: Mode, shade: ShadeVariant, panels: PanelVariant): Surfaces => {
  return mode === "dark" ? createDarkSurfaces(shade, panels) : createLightSurfaces(shade, panels);
};

const createDarkSurfaces = (shade: ShadeVariant, panels: PanelVariant): Surfaces => {
  const depth = shadeDepth(shade);
  const bg = shade.level === 5 ? black() : mix(tw("zinc", 900), tw("zinc", 950), 0.18 + depth * 0.72);
  const contrast = panels.surfaceContrast;
  const layers =
    shade.level === 5 ? createPureBlackLayers(bg, contrast) : createDarkLayers(bg, depth, contrast);
  const muted = tw("zinc", 500);
  const subtle = mix(tw("zinc", 600), bg, 0.2 + depth * 0.18);

  return {
    bg,
    editor: bg,
    ...layers,
    line: withAlpha(mix(tw("zinc", 700), bg, 0.2 + depth * 0.1), 0.32),
    lineStrong: withAlpha(mix(tw("zinc", 600), bg, 0.18 + depth * 0.1), 0.42),
    fg: tw("zinc", 200),
    muted,
    subtle,
    deemphasized: createDeemphasized(muted, subtle),
    ghost: withAlpha(mix(tw("zinc", 600), bg, 0.22 + depth * 0.18), 0.42),
    selection: withAlpha(white(), 0.085 + depth * 0.025),
    selectionSoft: withAlpha(white(), 0.045 + depth * 0.015),
    shadow: withAlpha(black(), 0.36),
    inverse: white(),
    isDark: true,
  };
};

const createDarkLayers = (bg: string, depth: number, contrast: number): SurfaceLayers => ({
  chrome0: mix(bg, tw("zinc", 950), scaled(0.34 + depth * 0.12, contrast)),
  chrome1: mix(bg, tw("zinc", 900), scaled(0.22 + (1 - depth) * 0.12, contrast)),
  chrome2: mix(bg, tw("zinc", 900), scaled(0.3 + (1 - depth) * 0.12, contrast)),
  chrome3: mix(bg, tw("zinc", 800), scaled(0.16 + (1 - depth) * 0.06, contrast)),
  overlay: mix(bg, tw("zinc", 800), scaled(0.24 + (1 - depth) * 0.06, contrast)),
  overlay2: mix(bg, tw("zinc", 700), scaled(0.2 + (1 - depth) * 0.06, contrast)),
  raised: mix(bg, tw("zinc", 700), scaled(0.26 + (1 - depth) * 0.08, contrast)),
});

const createPureBlackLayers = (bg: string, contrast: number): SurfaceLayers => ({
  chrome0: mix(bg, tw("zinc", 900), scaled(0.64, contrast)),
  chrome1: mix(bg, tw("zinc", 900), scaled(0.74, contrast)),
  chrome2: mix(bg, tw("zinc", 900), scaled(0.78, contrast)),
  chrome3: mix(bg, tw("zinc", 800), scaled(0.66, contrast)),
  overlay: mix(bg, tw("zinc", 800), scaled(0.66, contrast)),
  overlay2: mix(bg, tw("zinc", 700), scaled(0.58, contrast)),
  raised: mix(bg, tw("zinc", 700), Math.max(scaled(0.62, contrast), 0.62)),
});

const createLightSurfaces = (shade: ShadeVariant, panels: PanelVariant): Surfaces => {
  const depth = shadeDepth(shade);
  const bg = mix(white(), tw("zinc", 200), depth);
  const muted = tw("zinc", 600);
  const subtle = tw("zinc", 500);

  return {
    bg,
    editor: bg,
    ...createLightLayers(bg, depth, panels.surfaceContrast),
    line: withAlpha(mix(tw("zinc", 300), tw("zinc", 500), depth * 0.36), 0.44),
    lineStrong: withAlpha(mix(tw("zinc", 400), tw("zinc", 600), depth * 0.34), 0.54),
    fg: tw("zinc", 950),
    muted,
    subtle,
    deemphasized: createDeemphasized(muted, subtle),
    ghost: withAlpha(tw("zinc", 400), 0.42),
    selection: withAlpha(black(), 0.1 + depth * 0.04),
    selectionSoft: withAlpha(black(), 0.055 + depth * 0.02),
    shadow: withAlpha(black(), 0.12),
    inverse: black(),
    isDark: false,
  };
};

const createLightLayers = (bg: string, depth: number, contrast: number): SurfaceLayers => ({
  chrome0: mix(bg, tw("zinc", 300), scaled(0.12 + depth * 0.1, contrast)),
  chrome1: mix(bg, tw("zinc", 300), scaled(0.08 + depth * 0.08, contrast)),
  chrome2: mix(bg, tw("zinc", 300), scaled(0.12 + depth * 0.1, contrast)),
  chrome3: mix(bg, tw("zinc", 300), scaled(0.16 + depth * 0.12, contrast)),
  overlay: mix(bg, white(), scaled(0.82 - depth * 0.22, contrast)),
  overlay2: mix(bg, tw("zinc", 300), scaled(0.1 + depth * 0.12, contrast)),
  raised: mix(
    mix(bg, white(), scaled(0.82 - depth * 0.22, contrast)),
    tw("zinc", 300),
    scaled(0.24 + depth * 0.1, contrast),
  ),
});

const createDeemphasized = (muted: string, subtle: string): string => mix(muted, subtle, 0.58);

const scaled = (amount: number, contrast: number): number => amount * contrast;

const shadeDepth = (shade: ShadeVariant): number => (shade.level - 1) / 4;
