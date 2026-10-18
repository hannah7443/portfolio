import { BASE_SEED, hashSeed, mulberry32 } from "./random";
import type { Letter, Slot, StyleId } from "./types";

// The ~16s loop (spec §4, retimed). Each loop is planned once from a seeded PRNG
// (keyed by loop index, so it's the same on every visit), then looked up
// per letter per frame. Anything not covered by an interval is "rest" —
// the solid hinge, which breathes (Solid's motion) rather than standing
// still. Every change is a hard cut. The spec's "pop" beat (letters
// vanishing one by one) was dropped at Hannah's request; that time is rest.
//
// Each rest ends with a short "still" beat: the breathing holds where it
// was and only a faint flicker remains, before the next phase cuts in — a
// near-pause so the piece reads as less busy overall (Hannah's call).

export type PhaseName = "rest" | "still" | "individual" | "unified";

/** Length of the near-motionless beat at the end of every rest. */
const STILL_SECONDS = 0.6;

/**
 * Phase lengths in seconds, in order. The two rests either side of the
 * unified phase are long on purpose (Hannah's call), so the breathing solid
 * gets a proper look before everything switches together, and again before
 * the letters split back into their own styles.
 */
const SEQUENCE: { seconds: number; name: PhaseName }[] = [
  { seconds: 0.8, name: "rest" },
  { seconds: STILL_SECONDS, name: "still" },
  { seconds: 4.2, name: "individual" },
  { seconds: 2.6, name: "rest" }, // after individual, before unified (was 0.4)
  { seconds: STILL_SECONDS, name: "still" },
  { seconds: 3.6, name: "unified" },
  { seconds: 2.8, name: "rest" }, // after unified, before individual (was 1.6)
  { seconds: STILL_SECONDS, name: "still" },
  { seconds: 3.4, name: "individual" },
];

const PHASES = SEQUENCE.reduce<{ start: number; end: number; name: PhaseName }[]>((acc, { seconds, name }) => {
  const start = acc.length ? acc[acc.length - 1].end : 0;
  acc.push({ start, end: start + seconds, name });
  return acc;
}, []);

export const LOOP_SECONDS = PHASES[PHASES.length - 1].end;

/** Tunables — adjust by feel (build step 8). */
export const TIMING = {
  individualOffsetMax: 0.6,
  dipChance: 0.3,
  dipMin: 0.3,
  dipMax: 0.5,
  unifiedStagger: 0, // seconds per letter, left to right; spec allows 0 or 0.04
};

const UNIFIED_ROTATION: StyleId[] = ["ascii", "dots", "crossStitch", "outline", "solid"];

type Interval = { start: number; end: number; slot: Slot };

export type LoopPlan = { unifiedStyle: StyleId; intervals: Interval[][] };

export function phaseAt(tLoop: number): PhaseName {
  return PHASES.find((p) => tLoop >= p.start && tLoop < p.end)?.name ?? "rest";
}

export function unifiedStyleFor(loopIndex: number, letters: Letter[]): StyleId {
  // Morph only joins the rotation once every letter has a vector definition.
  const rotation = letters.every((l) => l.vector) ? [...UNIFIED_ROTATION, "morph" as const] : UNIFIED_ROTATION;
  return rotation[((loopIndex % rotation.length) + rotation.length) % rotation.length];
}

export function planLoop(loopIndex: number, letters: Letter[]): LoopPlan {
  const random = mulberry32(hashSeed(BASE_SEED, 2, loopIndex));
  const between = (a: number, b: number) => a + random() * (b - a);
  const unifiedStyle = unifiedStyleFor(loopIndex, letters);
  const intervals: Interval[][] = letters.map(() => []);

  for (const phase of PHASES) {
    if (phase.name === "individual") {
      // Staggered, overlapping entry; some letters dip back to solid mid-phase.
      letters.forEach((letter, i) => {
        const start = phase.start + random() * TIMING.individualOffsetMax;
        const own = letter.ownStyle;
        if (random() < TIMING.dipChance) {
          const dur = between(TIMING.dipMin, TIMING.dipMax);
          const lo = start + 0.2;
          const hi = phase.end - dur - 0.1;
          if (hi > lo) {
            const dipStart = between(lo, hi);
            intervals[i].push({ start, end: dipStart, slot: own }, { start: dipStart + dur, end: phase.end, slot: own });
            return;
          }
        }
        intervals[i].push({ start, end: phase.end, slot: own });
      });
    } else if (phase.name === "still") {
      letters.forEach((_, i) => intervals[i].push({ start: phase.start, end: phase.end, slot: "still" }));
    } else if (phase.name === "unified") {
      letters.forEach((_, i) => {
        intervals[i].push({ start: phase.start + i * TIMING.unifiedStagger, end: phase.end, slot: unifiedStyle });
      });
    }
  }

  return { unifiedStyle, intervals };
}

/** What a letter shows at `tLoop`, and since when (loop-relative seconds). */
export function slotAt(plan: LoopPlan, letterIndex: number, tLoop: number): { slot: Slot; start: number } {
  let restStart = 0;
  for (const iv of plan.intervals[letterIndex]) {
    if (tLoop >= iv.start && tLoop < iv.end) return { slot: iv.slot, start: iv.start };
    if (iv.end <= tLoop) restStart = Math.max(restStart, iv.end);
  }
  return { slot: "rest", start: restStart };
}
