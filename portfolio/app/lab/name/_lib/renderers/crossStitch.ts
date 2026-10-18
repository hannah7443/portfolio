import { derived } from "../grid";
import { noise } from "../random";
import type { Renderer, StyleDef } from "../types";

/**
 * Cross-stitch (spec §3.3, reworked). The spec turns the letter in 3D, but
 * that squashed and skewed the letters until they stopped reading, so the
 * shape is now fixed (Hannah's call): every filled cell is always a stitch,
 * exactly where the letter is drawn. The motion is in the stitches' tone:
 * a light sweeps side to side across each letter, catching the edge
 * stitches on the far side, and scattered stitches churn bright through a
 * slow noise field.
 *
 * Tones on black: the Figma's stitch "a" is white ×s, so base stitches are
 * the Figma's dark grey and shading/edge stitches are white — the inverse of
 * the reference's pale-blue-on-white, keeping the same contrast relationship.
 */

/** How fast the light swings side to side (radians per second, as the spec's turn rate). */
const LIGHT_SPEED = 1.0;
/** Scattered bright stitches: a stitch lights up where the noise field peaks above this. */
const SCATTER = 0.50;

const drawCrossStitch: Renderer = (ctx, letter, box, t, p) => {
  const { sdf } = derived(letter);
  const mask = letter.mask;
  const rows = mask.length;
  const cols = mask[0].length;
  const { cw, ch } = box;

  const lightX = Math.sin(t * LIGHT_SPEED + letter.seed); // -1 = light from the left, 1 = from the right

  // 0 = empty, 1 = base stitch, 2 = shade stitch
  const tone: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mask[r][c]) continue;
      // Near the edge on the side facing away from the light, or a scattered stitch.
      const normalX = sdf[r][Math.min(cols - 1, c + 1)] - sdf[r][Math.max(0, c - 1)];
      const nearEdge = sdf[r][c] > -2;
      const shaded = (nearEdge && normalX * lightX < 0) || noise(c * 0.5, r * 0.5 + letter.seed, t * 0.5) > SCATTER;
      tone[r][c] = shaded ? 2 : 1;
    }
  }

  // Two diagonal strokes per stitch, inset 18%, round caps — batched into one path per tone.
  const inset = 0.18;
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.5 * p.dpr, 0.17 * Math.min(cw, ch));
  for (const [value, color] of [
    [1, p.dark],
    [2, `rgb(${p.ink})`],
  ] as const) {
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (tone[r][c] !== value) continue;
        const x0 = box.x + (c + inset) * cw;
        const x1 = box.x + (c + 1 - inset) * cw;
        const y0 = box.y + (r + inset) * ch;
        const y1 = box.y + (r + 1 - inset) * ch;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.moveTo(x1, y0);
        ctx.lineTo(x0, y1);
      }
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  }
};

export const crossStitch: StyleDef = { draw: drawCrossStitch };
