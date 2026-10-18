import { derived } from "../grid";
import { noise } from "../random";
import type { Letter, Renderer, StyleDef } from "../types";

/**
 * Dots — rewritten per app/reference/dots-reference/DOTS-FIX.md (replaces
 * spec §3.2). Every cell stays on its fixed grid and never grows past it;
 * the motion is cells stepping between six glyphs of a tonal ladder:
 *
 *   L0 empty · L1 small ring · L2 large ring · L3 ring + dot ·
 *   L4 ring + inner "c" · L5 filled disc with the "c" knocked out
 *
 * A domain-warped noise field (so it boils rather than scrolls) picks each
 * cell's level, biased so the rim of the letter stays denser than its
 * interior and the lower part denser than the upper. Unlike DOTS-FIX.md,
 * there's no bottom fade: Hannah asked for the letters to stay solid to the baseline.
 */

/** Glyph colour (DOTS-FIX colours). The background/knockout colour is the page's paper. */
const GLYPH = "#EBEBEB";

/**
 * Field. The doc's form is v = 0.55·noise + 0.30·rim + 0.15·lower, but the
 * Figma letters are thin (most cells sit on the edge, max depth 1–2 cells),
 * so rim/lower act as a near-constant offset there: v stays in ~0.35–0.9 and
 * L0/L1 never appear. So instead the noise is contrast-stretched to fill
 * 0–1 on its own, and rim/lower are added as biases around each letter's
 * own mean — edge cells still sit denser than interior ones, lower than
 * upper, but every letter keeps the full six-level range.
 */
const NOISE_CONTRAST = 1.7;
/** Lifts the whole field: the reference is mostly L4–L5 tiles with holes, not mostly empty. */
const DENSITY = 0.12;
const W_RIM = 0.3;
const W_LOWER = 0.15;
/** Field speed — tuned so ~100ms frames show about as much reshaping as 02-motion-100ms-steps.png. */
const FIELD_SPEED = 1.4;
const WARP_SPEED = 0.6;

/** Hysteresis: a cell only leaves its level once the field is this far past the boundary, which damps single-frame flicker. */
const HYSTERESIS = 0.03;

/** Glyph geometry in cell units (cell = 1). */
const G = { ringSmall: 0.26, ringLarge: 0.42, stroke: 0.05, dot: 0.07, arcR: 0.17, disc: 0.45 };
const ARC_START = (50 * Math.PI) / 180; // inner "c": gap facing right
const ARC_END = (310 * Math.PI) / 180;

/** Per filled cell: position and its zero-mean structure bias (rim + lower). */
type CellField = { r: number; c: number; bias: number }[];
const fieldCache = new WeakMap<Letter, CellField>();
const levelState = new WeakMap<Letter, Int8Array>();

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smoothstep = (e0: number, e1: number, x: number) => {
  const u = clamp01((x - e0) / (e1 - e0));
  return u * u * (3 - 2 * u);
};

/** Per-cell structure terms, computed once per letter. */
function cellField(letter: Letter): CellField {
  let field = fieldCache.get(letter);
  if (field) return field;
  const { sdf, ink } = derived(letter);
  // sdf is -0.5 on the edge cells, so depth = -sdf - 0.5 is 0 at the edge.
  let maxDepth = 1;
  letter.mask.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) maxDepth = Math.max(maxDepth, -sdf[r][c] - 0.5);
    }),
  );
  const cells: { r: number; c: number; rim: number; lower: number }[] = [];
  letter.mask.forEach((row, r) =>
    row.forEach((on, c) => {
      if (!on) return;
      const depthN = clamp01((-sdf[r][c] - 0.5) / maxDepth);
      const yN = (r - ink.top) / Math.max(1, ink.bottom - ink.top);
      cells.push({ r, c, rim: 1 - smoothstep(0, 0.55, depthN), lower: smoothstep(0.35, 1, yN) });
    }),
  );
  const mean = (k: "rim" | "lower") => cells.reduce((a, cell) => a + cell[k], 0) / Math.max(1, cells.length);
  const rimMean = mean("rim");
  const lowerMean = mean("lower");
  field = cells.map(({ r, c, rim, lower }) => ({ r, c, bias: W_RIM * (rim - rimMean) + W_LOWER * (lower - lowerMean) }));
  fieldCache.set(letter, field);
  levelState.set(letter, new Int8Array(field.length).fill(-1));
  return field;
}

function levelFor(v: number, previous: number): number {
  const raw = Math.min(5, Math.max(0, Math.floor(v * 6)));
  if (previous < 0 || raw === previous) return raw;
  // Stay put unless v is clearly past the edge of the previous level's band.
  const lo = previous / 6 - HYSTERESIS;
  const hi = (previous + 1) / 6 + HYSTERESIS;
  return v < lo || v >= hi ? raw : previous;
}

const drawDots: Renderer = (ctx, letter, box, t, p) => {
  const field = cellField(letter);
  const levels = levelState.get(letter)!;
  const { cw, ch } = box;
  const s = Math.min(cw, ch);
  const minLine = Math.max(1, p.dpr);
  const stroke = Math.max(minLine, G.stroke * s);
  const seed = letter.seed;

  // Level per cell from the warped field.
  field.forEach((cell, i) => {
    const { r: y, c: x } = cell;
    const warpX = noise(x * 0.12, y * 0.12, t * WARP_SPEED + seed) * 4;
    const warpY = noise(x * 0.12 + 31.7, y * 0.12, t * WARP_SPEED + seed) * 4;
    const n = clamp01(0.5 + 0.5 * NOISE_CONTRAST * noise((x + warpX) * 0.18, (y + warpY) * 0.18, t * FIELD_SPEED + seed));
    const v = clamp01(n + cell.bias + DENSITY);
    levels[i] = levelFor(v, levels[i]);
  });

  // Glyph strokes and fills, batched: rings (one stroked path), small dots + discs (one filled path).
  ctx.strokeStyle = GLYPH;
  ctx.fillStyle = GLYPH;
  ctx.lineWidth = stroke;
  const rings = new Path2D();
  const fills = new Path2D();
  const arcs = new Path2D(); // L4 "c" in glyph colour
  const knockouts = new Path2D(); // L5 "c" in background colour
  const centerOf = (cell: CellField[number]) => [box.x + (cell.c + 0.5) * cw, box.y + (cell.r + 0.5) * ch] as const;
  const ring = (path: Path2D, x: number, y: number, r: number) => {
    path.moveTo(x + r, y);
    path.arc(x, y, r, 0, Math.PI * 2);
  };
  const cArc = (path: Path2D, x: number, y: number) => {
    const r = G.arcR * s;
    path.moveTo(x + r * Math.cos(ARC_START), y + r * Math.sin(ARC_START));
    path.arc(x, y, r, ARC_START, ARC_END);
  };

  field.forEach((cell, i) => {
    const level = levels[i];
    if (level === 0) return;
    const [x, y] = centerOf(cell);
    if (level === 1) ring(rings, x, y, G.ringSmall * s);
    else if (level < 5) {
      ring(rings, x, y, G.ringLarge * s);
      if (level === 3) {
        fills.moveTo(x + G.dot * s, y);
        fills.arc(x, y, Math.max(minLine, G.dot * s), 0, Math.PI * 2);
      } else if (level === 4) cArc(arcs, x, y);
    } else {
      fills.moveTo(x + G.disc * s, y);
      fills.arc(x, y, G.disc * s, 0, Math.PI * 2);
      cArc(knockouts, x, y);
    }
  });
  ctx.stroke(rings);
  ctx.fill(fills);
  ctx.stroke(arcs);
  // Knock the "c" out of the L5 discs in the background colour (the paper is flat, so no offscreen layer needed).
  ctx.strokeStyle = p.paper;
  ctx.stroke(knockouts);
};

export const dots: StyleDef = { draw: drawDots };
