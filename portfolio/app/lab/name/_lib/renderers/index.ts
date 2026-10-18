import type { Letter, StyleDef, StyleId } from "../types";
import { ascii } from "./ascii";
import { crossStitch } from "./crossStitch";
import { dots } from "./dots";
import { morph } from "./morph";
import { outline } from "./outline";
import { solid } from "./solid";

export const STYLES: Record<StyleId, StyleDef> = { solid, dots, crossStitch, ascii, outline, morph };

/**
 * The style a letter can actually draw. Morph needs vector art, which only
 * the Figma Morph letters have, so any other letter falls back to Solid
 * (e.g. when Morph is forced from the debug panel).
 */
export function styleFor(style: StyleId, letter: Letter): { def: StyleDef; fallback: boolean } {
  if (style === "morph" && !letter.vector) return { def: solid, fallback: true };
  return { def: STYLES[style], fallback: false };
}
