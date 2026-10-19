import { STYLES, styleFor } from "./renderers";
import { LOOP_SECONDS, phaseAt, planLoop, slotAt, type LoopPlan, type PhaseName } from "./timeline";
import type { Letter, Rect, RenderInfo, Slot, StyleId, StyleParams } from "./types";

// Owns the clock, the timeline lookup and drawing. React only mounts the
// canvas and drives tick()/draw() from one requestAnimationFrame loop.
// Time is accumulated from real elapsed seconds (not frames), and only
// while running, so pausing or hiding the tab never makes the loop jump.

/** Palette, from the Figma: white ink on black, plus its two greys (the ASCII blocks). */
export const PALETTE = { paper: "#000000", ink: "255, 255, 255", light: "#d9d9d9", dark: "#888888" };

/** Figma px per base cell — the grid most of the Figma letters are drawn on. */
const FIGMA_CELL = 16;

/** During the still beat, Solid's flicker runs at this fraction of its normal amount (breathing is held). */
const STILL_FLICKER_SCALE = 0.5;
/** Entrance (homepage intro): seconds between each letter cutting in, left to right. */
const ENTRANCE_STEP = 0.07;
/** Entrance style for the letters whose own style is solid, so every letter cuts in patterned (Hannah's call). */
const ENTRANCE_INSTEAD_OF_SOLID: StyleId[] = ["crossStitch", "dots"];
/** Gap between "hannah" and "shin" when they stack on two lines, in Figma px. */
const LINE_GAP = 2 * FIGMA_CELL;

type Layout = { boxes: Rect[]; origin: { x: number; y: number }; cell: number };

/** How the name is fitted into its canvas. */
export type Fit = {
  /** "auto": one line, stacking "shin" under "hannah" on portrait canvases. "one": always one line. */
  lines: "auto" | "one";
  /** Share of the canvas width / height the name may fill. */
  fillW: number;
  fillH: number;
};

/** The /lab/name page: centered with breathing room, stacking on portrait screens. */
export const LAB_FIT: Fit = { lines: "auto", fillW: 0.9, fillH: 0.62 };
/** A full-width strip (the homepage): one line, filling its container, which takes the name's own aspect ratio (nameAspect). */
export const STRIP_FIT: Fit = { lines: "one", fillW: 1, fillH: 1 };

/** A letter's padded mask extent in Figma px. */
function extent(letter: Letter) {
  const { left, bottom, pitchX, pitchY } = letter.place;
  return { left, right: left + letter.mask[0].length * pitchX, top: bottom - letter.mask.length * pitchY, bottom };
}

function lineExtent(line: Letter[]) {
  const e = line.map(extent);
  return {
    left: Math.min(...e.map((x) => x.left)),
    right: Math.max(...e.map((x) => x.right)),
    top: Math.min(...e.map((x) => x.top)),
    bottom: Math.max(...e.map((x) => x.bottom)),
  };
}

/** Width ÷ height of the name laid out on one line (padded masks included) — the shape a full-width strip should take. */
export function nameAspect(words: Letter[][]): number {
  const e = lineExtent(words.flat());
  return (e.right - e.left) / (e.bottom - e.top);
}

/**
 * Places every letter where the Figma composition puts it, scaled so one
 * Figma base cell (16px) becomes a whole number of device pixels. Lays the
 * name out on one line, as in the Figma — except, with `fit.lines` "auto",
 * on portrait canvases, where "shin" stacks under "hannah" so the letters
 * don't shrink to nothing.
 */
function layout(words: Letter[][], width: number, height: number, fit: Fit): Layout {
  const lines = fit.lines === "one" || width >= height ? [words.flat()] : words;
  const exts = lines.map(lineExtent);
  const fitW = Math.max(...exts.map((e) => e.right - e.left));
  const fitH = exts.reduce((n, e) => n + e.bottom - e.top, 0) + LINE_GAP * (lines.length - 1);
  const cell = Math.max(2, Math.floor(Math.min((width * fit.fillW) / (fitW / FIGMA_CELL), (height * fit.fillH) / (fitH / FIGMA_CELL))));

  const toPx = (figmaPx: number) => Math.round((figmaPx / FIGMA_CELL) * cell);
  const totalH = exts.reduce((n, e) => n + toPx(e.bottom - e.top), 0) + toPx(LINE_GAP) * (lines.length - 1);
  let lineTop = Math.round((height - totalH) / 2);
  const origin = { x: Infinity, y: lineTop };
  const boxes: Rect[] = [];

  lines.forEach((line, li) => {
    const e = exts[li];
    const lineLeft = Math.round((width - toPx(e.right - e.left)) / 2);
    origin.x = Math.min(origin.x, lineLeft);
    for (const letter of line) {
      const { left, bottom, pitchX, pitchY } = letter.place;
      const cw = Math.max(1, toPx(pitchX));
      const ch = Math.max(1, toPx(pitchY));
      const w = letter.mask[0].length * cw;
      const h = letter.mask.length * ch;
      // Anchor at the bottom-left, as in the Figma, so baselines line up.
      const x = lineLeft + toPx(left - e.left);
      const y = lineTop + toPx(bottom - e.top) - h;
      boxes.push({ x, y, w, h, cw, ch });
    }
    lineTop += toPx(e.bottom - e.top) + toPx(LINE_GAP);
  });
  return { boxes, origin, cell };
}

export type DebugState = {
  showGrid: boolean;
  showLabels: boolean;
};

export class NameEngine {
  readonly words: Letter[][];
  readonly letters: Letter[];
  /** Seconds of animation elapsed (only advances while running). */
  time = 0;
  paused = false;
  /** Debug/reduced-motion override: every letter shows this slot. null = follow the timeline. */
  forced: Slot | null = null;
  /** Global time the forced slot took effect (its letters' style start). */
  private forcedSince = 0;
  debug: DebugState = { showGrid: false, showLabels: false };
  params: StyleParams = { ...PALETTE, dpr: 1 };

  private plans = new Map<number, LoopPlan>();
  private layout: Layout | null = null;
  private size = { width: 0, height: 0 };

  private readonly fit: Fit;
  /** Letters cut in one by one, left to right, over the first moments of the clock (once only). */
  private readonly entrance: boolean;
  /** Per letter: the style it cuts in with, and when (global seconds) the timeline takes over from it. */
  private entranceSlots: { slot: StyleId; until: number }[] = [];

  constructor(words: Letter[][], fit: Fit = LAB_FIT, { entrance = false } = {}) {
    this.words = words;
    this.letters = words.flat();
    this.fit = fit;
    this.entrance = entrance;
    if (entrance) {
      // Each letter holds its entrance style through the first loop's opening rest and still,
      // until its own first styled interval begins, so it never shows the plain solid in between.
      let solids = 0;
      const first = this.plan(0);
      this.entranceSlots = this.letters.map((letter, i) => ({
        slot:
          letter.ownStyle === "solid"
            ? ENTRANCE_INSTEAD_OF_SOLID[solids++ % ENTRANCE_INSTEAD_OF_SOLID.length]
            : letter.ownStyle,
        until: first.intervals[i].find((iv) => iv.slot !== "still")?.start ?? 0,
      }));
    }
  }

  get loopIndex() {
    return Math.floor(this.time / LOOP_SECONDS);
  }

  get loopTime() {
    return this.time - this.loopIndex * LOOP_SECONDS;
  }

  get phase(): PhaseName {
    return phaseAt(this.loopTime);
  }

  plan(loopIndex = this.loopIndex): LoopPlan {
    let plan = this.plans.get(loopIndex);
    if (!plan) {
      plan = planLoop(loopIndex, this.letters);
      this.plans.set(loopIndex, plan);
      if (this.plans.size > 4) this.plans.delete(this.plans.keys().next().value!);
    }
    return plan;
  }

  slot(letterIndex: number): Slot {
    return this.slotWithStart(letterIndex).slot;
  }

  /** The letter's slot plus the global time it started. */
  private slotWithStart(letterIndex: number): { slot: Slot; since: number } {
    if (this.forced) return { slot: this.forced, since: this.forcedSince };
    const entering = this.entranceSlots[letterIndex];
    if (entering && this.time < entering.until) return { slot: entering.slot, since: letterIndex * ENTRANCE_STEP };
    const { slot, start } = slotAt(this.plan(), letterIndex, this.loopTime);
    return { slot, since: this.loopIndex * LOOP_SECONDS + start };
  }

  // Mutations go through methods (not field writes from components) so
  // React's lint rules don't treat the engine as mutated React state.
  togglePause() {
    this.paused = !this.paused;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  setForced(slot: Slot | null) {
    this.forced = slot;
    this.forcedSince = this.time;
  }

  toggleDebug(key: keyof DebugState) {
    this.debug[key] = !this.debug[key];
  }

  /**
   * Reduced motion: freeze on one slot at a fixed moment, drawn on demand
   * rather than in a loop. The style starts at that moment, so time-in-style
   * effects show their opening state (ASCII at full resolution, the Morph
   * letters as their Figma composite).
   */
  showStill(slot: Slot, time: number) {
    this.forced = slot;
    this.time = time;
    this.forcedSince = time;
  }

  /** Jumps to `seconds` within the current loop (debug scrubber). */
  scrubTo(seconds: number) {
    this.time = this.loopIndex * LOOP_SECONDS + Math.min(LOOP_SECONDS - 1e-6, Math.max(0, seconds));
  }

  tick(dt: number) {
    if (!this.paused) this.time += Math.min(dt, 0.1);
  }

  resize(width: number, height: number, dpr: number) {
    this.size = { width, height };
    this.params.dpr = dpr;
    this.layout = layout(this.words, width, height, this.fit);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.size;
    const lay = this.layout;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.params.paper;
    ctx.fillRect(0, 0, width, height);
    if (!lay) return;

    if (this.debug.showGrid) this.drawGrid(ctx, lay);

    const states = this.letters.map((letter, i) => {
      const { slot, since } = this.slotWithStart(i);
      const style = slot === "rest" || slot === "still" ? null : styleFor(slot, letter);
      return { letter, box: lay.boxes[i], slot, style, info: { since, index: i, unified: false } as RenderInfo };
    });

    // Unified: every letter shares one style.
    const unified = this.forced !== null || (this.phase === "unified" && states.every((s) => s.slot === states[0].slot));

    for (const s of states) {
      // Not cut in yet: leave the paper showing.
      if (this.entrance && this.time < s.info.index * ENTRANCE_STEP) continue;
      s.info.unified = unified;
      // Rest is the moving solid (Solid's breathing).
      if (s.slot === "rest") STYLES.solid.draw(ctx, s.letter, s.box, this.time, this.params, s.info);
      // Still: the same solid with its breathing held where the still began and only a faint flicker left.
      else if (s.slot === "still") {
        const params = { ...this.params, solidHold: { breathAt: s.info.since, flickerScale: STILL_FLICKER_SCALE } };
        STYLES.solid.draw(ctx, s.letter, s.box, this.time, params, s.info);
      }
      else if (s.style) s.style.def.draw(ctx, s.letter, s.box, this.time, this.params, s.info);
      if (this.debug.showLabels) this.drawLabel(ctx, s.box, s.style?.fallback ? `${s.slot}→solid` : s.slot);
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D, lay: Layout) {
    const { width, height } = this.size;
    const { cell, origin } = lay;
    ctx.fillStyle = `rgba(${this.params.ink}, 0.12)`;
    for (let x = origin.x % cell; x < width; x += cell) ctx.fillRect(x, 0, 1, height);
    for (let y = origin.y % cell; y < height; y += cell) ctx.fillRect(0, y, width, 1);
  }

  private drawLabel(ctx: CanvasRenderingContext2D, box: Rect, text: string) {
    const dpr = this.params.dpr;
    ctx.fillStyle = "rgba(220, 40, 40, 0.9)";
    ctx.font = `${Math.round(10 * dpr)}px ui-monospace, monospace`;
    ctx.textBaseline = "bottom";
    ctx.fillText(text, box.x + box.cw, box.y - 2 * dpr);
  }
}
