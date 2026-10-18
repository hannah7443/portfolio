import { MASK_PAD } from "../grid";
import { noise } from "../random";
import type { Letter, Renderer, Shape, StyleDef } from "../types";

/**
 * Morph ("shape") style — reworked to move like Dots (Hannah's call), not
 * spec §3.6's morph-into-a-basic-shape. The Figma Morph letters (the second
 * h, the i) are built from primitives: circles, rects and triangles. Every
 * primitive stays exactly where the Figma puts it; the motion is each one
 * stepping between six states, the same tonal ladder Dots uses for its
 * glyphs, applied to the shape itself:
 *
 *   L0 empty · L1 small outline · L2 outline · L3 outline + small filled copy ·
 *   L4 filled · L5 filled with a small copy knocked out
 *
 * The same domain-warped noise field as Dots picks each primitive's level
 * (sampled at its center), so it boils and flickers rather than sliding, and
 * there's no tweening between levels.
 */

/** Same field constants as Dots, so the two styles move alike. */
const FIELD_SPEED = 1.4;
const WARP_SPEED = 0.6;
const NOISE_CONTRAST = 1.7;
/** Lifts the field so most shapes are outlined or filled at any moment and the letter stays readable. */
const DENSITY = 0.15;
const HYSTERESIS = 0.03;

/** Ladder geometry, as fractions of the primitive's own size. */
const SMALL_OUTLINE = 0.6;
const INNER_COPY = 0.4;
/** Outline stroke, as a fraction of the letter's cell (min 1 device px). */
const STROKE = 0.08;

type Primitive = { path: Path2D; cx: number; cy: number };
type MorphGeometry = { primitives: Primitive[]; levels: Int8Array };

const geometryCache = new WeakMap<Letter, MorphGeometry>();

function toPath(s: Shape): { path: Path2D; cx: number; cy: number } {
  const path = new Path2D();
  if (s.kind === "circle") {
    path.arc(s.cx, s.cy, s.r, 0, Math.PI * 2);
    return { path, cx: s.cx, cy: s.cy };
  }
  if (s.kind === "rect") {
    path.rect(s.x, s.y, s.w, s.h);
    return { path, cx: s.x + s.w / 2, cy: s.y + s.h / 2 };
  }
  let sx = 0;
  let sy = 0;
  const n = s.points.length / 2;
  for (let i = 0; i < s.points.length; i += 2) {
    if (i === 0) path.moveTo(s.points[i], s.points[i + 1]);
    else path.lineTo(s.points[i], s.points[i + 1]);
    sx += s.points[i];
    sy += s.points[i + 1];
  }
  path.closePath();
  return { path, cx: sx / n, cy: sy / n };
}

/** Builds every Morph letter's primitive paths once at load (spec §5). */
export function prepareMorph(letters: Letter[]) {
  for (const letter of letters) {
    if (!letter.vector) continue;
    const primitives = letter.vector.shapes.map(toPath);
    geometryCache.set(letter, { primitives, levels: new Int8Array(primitives.length).fill(-1) });
  }
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function levelFor(v: number, previous: number): number {
  const raw = Math.min(5, Math.max(0, Math.floor(v * 6)));
  if (previous < 0 || raw === previous) return raw;
  const lo = previous / 6 - HYSTERESIS;
  const hi = (previous + 1) / 6 + HYSTERESIS;
  return v < lo || v >= hi ? raw : previous;
}

const drawMorph: Renderer = (ctx, letter, box, t, p) => {
  const geo = geometryCache.get(letter);
  const art = letter.vector;
  if (!geo || !art) return;

  const pitch = letter.place.pitchX;
  const seed = letter.seed;
  // Figma px → device px: the art is bottom-aligned with the (unpadded) mask.
  const scale = box.cw / pitch;
  const ox = box.x + MASK_PAD * box.cw;
  const oy = box.y + box.h - MASK_PAD * box.ch - art.height * scale;
  const ink = `rgb(${p.ink})`;
  const lineWidth = Math.max(p.dpr, STROKE * box.cw) / scale;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "miter";

  // Draws `prim` scaled by k about its own center.
  const at = (prim: Primitive, k: number, draw: () => void) => {
    ctx.save();
    ctx.translate(prim.cx, prim.cy);
    ctx.scale(k, k);
    ctx.translate(-prim.cx, -prim.cy);
    ctx.lineWidth = lineWidth / k; // keep the stroke the same width at every size
    draw();
    ctx.restore();
  };

  geo.primitives.forEach((prim, i) => {
    // The field is sampled in cell units at the primitive's center, exactly like a Dots cell.
    const x = prim.cx / pitch;
    const y = prim.cy / pitch;
    const warpX = noise(x * 0.12, y * 0.12, t * WARP_SPEED + seed) * 4;
    const warpY = noise(x * 0.12 + 31.7, y * 0.12, t * WARP_SPEED + seed) * 4;
    const n = clamp01(0.5 + 0.5 * NOISE_CONTRAST * noise((x + warpX) * 0.18, (y + warpY) * 0.18, t * FIELD_SPEED + seed));
    const level = (geo.levels[i] = levelFor(clamp01(n + DENSITY), geo.levels[i]));

    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    switch (level) {
      case 0:
        return;
      case 1:
        at(prim, SMALL_OUTLINE, () => ctx.stroke(prim.path));
        return;
      case 2:
        ctx.stroke(prim.path);
        return;
      case 3:
        ctx.stroke(prim.path);
        at(prim, INNER_COPY, () => ctx.fill(prim.path));
        return;
      case 4:
        ctx.fill(prim.path);
        return;
      default:
        ctx.fill(prim.path);
        ctx.fillStyle = p.paper;
        at(prim, INNER_COPY, () => ctx.fill(prim.path));
    }
  });
  ctx.restore();
};

export const morph: StyleDef = { draw: drawMorph };
