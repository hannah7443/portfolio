import { derived } from "../grid";
import { noise } from "../random";
import type { Renderer, StyleDef } from "../types";

/**
 * Solid — threshold breathing (spec §3.1). A slowly drifting value `v`
 * re-thresholds the letter's blurred SDF every frame, so strokes thicken
 * and thin by whole-cell flips (never tweens) and thin terminals can
 * detach. Calm on purpose: this is the style that anchors the piece.
 *
 * On top of that, a light per-cell flicker (Hannah asked for a bit more
 * blinking): a faster, fine-grained noise nudges each cell's threshold, so
 * cells along the edges blink on and off on their own while the slow
 * breathing still drives the overall weight.
 */

/** Slow whole-letter breathing speed (spec: 0.35). */
const BREATH_SPEED = 0.45;
/**
 * Per-cell flicker: how far it can push a cell's threshold (in cells), how
 * fine its patches are, and how fast it churns. Edge cells sit ~0.35 from the
 * threshold, so at 0.42 a cell only flips when the noise peaks above ~0.8 —
 * a few edge cells at any moment, never the letter's core.
 */
const FLICKER_AMOUNT = 0.30;
const FLICKER_SCALE = 0.9;
const FLICKER_SPEED = 1.1;

const renderSolid: Renderer = (ctx, letter, box, t, p) => {
  // The still beat holds the breathing at the moment it began and shrinks the flicker (see StyleParams.solidHold).
  const hold = p.solidHold;
  const v = 0.5 + 0.15 * noise(letter.seed, 0, (hold ? hold.breathAt : t) * BREATH_SPEED);
  const flickerAmount = FLICKER_AMOUNT * (hold ? hold.flickerScale : 1);
  const threshold = (v - 0.5) * 3;
  const { sdfBlurred } = derived(letter);
  const { cw, ch } = box;

  ctx.fillStyle = `rgb(${p.ink})`;

  sdfBlurred.forEach((row, r) => {
    row.forEach((d, c) => {
      const flicker = flickerAmount * noise(c * FLICKER_SCALE, r * FLICKER_SCALE, t * FLICKER_SPEED + letter.seed);
      if (d < threshold + flicker) ctx.fillRect(box.x + c * cw, box.y + r * ch, cw, ch);
    });
  });
};

export const solid: StyleDef = { draw: renderSolid };
