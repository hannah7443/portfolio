import { hash01 } from "../random";
import type { Renderer, StyleDef } from "../types";

/**
 * ASCII (spec §3.4). The letter's cells hold re-rolling characters and
 * blocks, straight on the page background — the spec's field of dim "="
 * behind them was removed (Hannah's call). The treatments follow the Figma letters
 * (hannah n, shin h) rather than the spec's pink/green: empty light-grey
 * blocks, empty dark-grey blocks and white glyphs, in about the Figma's
 * proportions, plus the odd "=". The grid always stays at the letter's own
 * cell size: the spec's coarser resolution steps were removed (Hannah's
 * call), so blocks and glyphs keep one size throughout.
 *
 * All randomness is a stateless hash of (cell, tick), so a given moment
 * always looks the same — scrubbing and reduced-motion stills are stable.
 */

const TICK_HZ = 10;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@^\\>?[`";
const FONT = '"IBM Plex Mono", "JetBrains Mono", ui-monospace, monospace';

/** Cumulative treatment odds, from the Figma ASCII letters (~38% light, ~32% dark, ~25% glyph). */
const TREATMENTS = [
  { upTo: 0.38, kind: "light" },
  { upTo: 0.7, kind: "dark" },
  { upTo: 0.95, kind: "glyph" },
  { upTo: 1, kind: "equals" },
] as const;

/**
 * A value that re-rolls on its own schedule: each cell gets a fixed period
 * (`minTicks`…`minTicks + spreadTicks`) and phase, so on average it re-rolls
 * with probability ~1/period per tick, but never needs history to evaluate.
 */
function epochValue(tick: number, id: number, salt: number, minTicks: number, spreadTicks: number) {
  const period = minTicks + Math.floor(hash01(id, salt) * spreadTicks);
  const epoch = Math.floor((tick + hash01(id, salt + 1) * period) / period);
  return hash01(id, salt + 2, epoch);
}

const drawAscii: Renderer = (ctx, letter, box, t, p, info) => {
  const { cw, ch } = box;
  const tick = Math.floor(t * TICK_HZ);
  const fontPx = Math.round(ch * 0.8);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${fontPx}px ${FONT}`;

  letter.mask.forEach((row, r) => {
    row.forEach((on, c) => {
      if (!on) return;
      const id = info.index * 4096 + r * 64 + c;
      const x = box.x + c * cw;
      const y = box.y + r * ch;
      const kind = TREATMENTS.find((tr) => epochValue(tick, id, 10, 20, 26) < tr.upTo)!.kind;
      if (kind === "light" || kind === "dark") {
        // Grey blocks, like the Figma's rects.
        ctx.fillStyle = kind === "light" ? p.light : p.dark;
        ctx.fillRect(x, y, cw, ch);
        return;
      }
      ctx.fillStyle = `rgb(${p.ink})`;
      const glyph = kind === "equals" ? "=" : CHARS[Math.floor(epochValue(tick, id, 20, 3, 8) * CHARS.length)];
      ctx.fillText(glyph, x + cw / 2, y + ch / 2);
    });
  });
};

export const ascii: StyleDef = { draw: drawAscii };
