import { derived, type Polyline } from "../grid";
import type { Backdrop, Mask, Rect, Renderer, StyleDef, StyleParams } from "../types";

/**
 * Outline gallop (spec §3.5). A single stroke traces the stair-stepped
 * boundary of the letter along the cell edges, over a faint grid the size
 * of the letter's cells. The Figma's outline n uses a white stroke clipped
 * to the inside of the shape (8px stroke, masked to the fill = 4px on a 16px
 * cell), so this draws the same: a quarter-cell inner stroke instead of the
 * spec's indigo-on-cream 2px line.
 *
 * Every letter drawn in this style gallops: it steps through the procedural
 * poses (grid.ts gallopPoses) every 310ms with no in-betweens. The two
 * Outline n's take the full stride in their own phase; in the unified phase
 * every letter gets a gentle version instead (a narrow band of rows nudged
 * one cell, travelling top to bottom), so letters that weren't drawn as legs
 * stay readable (Hannah's call; the spec let unified
 * just trace the rest mask).
 */

const POSE_SECONDS = 0.31;
const GRID_ALPHA = 0.14;

function gridLines(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: number, h: number, cw: number, ch: number, p: StyleParams) {
  ctx.fillStyle = `rgba(${p.ink}, ${GRID_ALPHA})`;
  const line = Math.max(1, Math.round(p.dpr));
  for (let x = x0; x <= x0 + w + 0.5; x += cw) ctx.fillRect(Math.round(x), y0, line, h);
  for (let y = y0; y <= y0 + h + 0.5; y += ch) ctx.fillRect(x0, Math.round(y), w, line);
}

function poseFor(letter: Parameters<Renderer>[1], t: number, unified: boolean): { mask: Mask; outline: Polyline[] } {
  const d = derived(letter);
  const poses = unified ? d.gentlePoses : d.poses;
  // Offset by the seed so letters stride out of step with each other.
  const i = Math.floor(t / POSE_SECONDS + letter.seed) % poses.length;
  return poses[i];
}

function strokeInside(ctx: CanvasRenderingContext2D, mask: Mask, outline: Polyline[], box: Rect, p: StyleParams) {
  const { cw, ch } = box;
  ctx.save();
  // Clip to the filled cells, then stroke at twice the visible width: only the inner half shows.
  ctx.beginPath();
  mask.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) ctx.rect(box.x + c * cw, box.y + r * ch, cw, ch);
    }),
  );
  ctx.clip();
  ctx.beginPath();
  for (const loop of outline) {
    for (let i = 0; i < loop.length; i += 2) {
      const x = box.x + loop[i] * cw;
      const y = box.y + loop[i + 1] * ch;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.strokeStyle = `rgb(${p.ink})`;
  ctx.lineWidth = Math.max(2 * p.dpr, 0.5 * Math.min(cw, ch));
  ctx.lineJoin = "miter";
  ctx.stroke();
  ctx.restore();
}

const drawOutline: Renderer = (ctx, letter, box, t, p, info) => {
  const { mask, outline } = poseFor(letter, t, info.unified);
  strokeInside(ctx, mask, outline, box, p);
};

/** Individual phase: graph paper behind just this letter's ink, one cell around it. */
const outlineBackground: Renderer = (ctx, letter, box, _t, p) => {
  const { ink } = derived(letter);
  const { cw, ch } = box;
  const c0 = Math.max(0, ink.left - 1);
  const r0 = Math.max(0, ink.top - 1);
  const c1 = Math.min(letter.mask[0].length, ink.right + 2);
  const r1 = Math.min(letter.mask.length, ink.bottom + 2);
  gridLines(ctx, box.x + c0 * cw, box.y + r0 * ch, (c1 - c0) * cw, (r1 - r0) * ch, cw, ch, p);
};

/** Unified phase: the whole canvas is graph paper on the base cell grid. */
const outlineBackdrop: Backdrop = (ctx, { width, height, cell }, _t, p) => {
  gridLines(ctx, 0, 0, width, height, cell, cell, p);
};

export const outline: StyleDef = { draw: drawOutline, background: outlineBackground, backdrop: outlineBackdrop };
