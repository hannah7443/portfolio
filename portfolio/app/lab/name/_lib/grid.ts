import type { Letter, Mask } from "./types";

// Grid helpers shared by several renderers (spec §1), plus the per-letter
// cache of everything derived from a mask (computed once at load).

/**
 * Signed distance field per cell, in cell units, negative inside. Brute
 * force (nearest opposite-state cell center), which is fine for masks this
 * size and only runs once at load. A boundary cell lands on ±0.5, so
 * `sdf < 0` reproduces the mask exactly.
 */
export function sdf(mask: Mask): number[][] {
  const rows = mask.length;
  const cols = mask[0]?.length ?? 0;
  const inside: [number, number][] = [];
  const outside: [number, number][] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) (mask[r][c] ? inside : outside).push([r, c]);

  const far = rows + cols;
  return mask.map((row, r) =>
    row.map((on, c) => {
      let best = far * far;
      for (const [r2, c2] of on ? outside : inside) {
        const d = (r - r2) ** 2 + (c - c2) ** 2;
        if (d < best) best = d;
      }
      const d = Math.sqrt(best) - 0.5;
      return on ? -d : d;
    }),
  );
}

/** Separable [1 2 1]/4 blur — the "1 cell Gaussian" Solid uses so thresholds produce organic edges. */
export function blur1(field: number[][]): number[][] {
  const rows = field.length;
  const cols = field[0]?.length ?? 0;
  const at = (f: number[][], r: number, c: number) => f[Math.min(rows - 1, Math.max(0, r))][Math.min(cols - 1, Math.max(0, c))];
  const h = field.map((row, r) => row.map((_, c) => (at(field, r, c - 1) + 2 * at(field, r, c) + at(field, r, c + 1)) / 4));
  return h.map((row, r) => row.map((_, c) => (at(h, r - 1, c) + 2 * at(h, r, c) + at(h, r + 1, c)) / 4));
}

/** Empty cells around every mask, so styles that grow or move the letter (Solid thickening, Outline strides, Cross-stitch side walls) have room. */
export const MASK_PAD = 2;

/** Adds `n` empty cells on every side, so styles that grow the letter (Solid thickening) have room. */
export function padMask(mask: Mask, n: number): Mask {
  const cols = (mask[0]?.length ?? 0) + 2 * n;
  const empty = () => Array<boolean>(cols).fill(false);
  return [
    ...Array.from({ length: n }, empty),
    ...mask.map((row) => [...Array<boolean>(n).fill(false), ...row, ...Array<boolean>(n).fill(false)]),
    ...Array.from({ length: n }, empty),
  ];
}

/** A closed polyline along cell edges, in cell units: [x0, y0, x1, y1, ...]. */
export type Polyline = number[];

/**
 * Closed polylines along the boundary between filled and empty cells
 * (marching squares on the grid lines). Edges run clockwise around filled
 * regions; collinear runs are merged so corners are the only vertices.
 */
export function traceOutline(mask: Mask): Polyline[] {
  const rows = mask.length;
  const cols = mask[0]?.length ?? 0;
  const on = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && mask[r][c];
  const key = (x: number, y: number) => y * (cols + 1) + x;
  const edges = new Map<number, [number, number][]>(); // start vertex -> end vertices
  const add = (x0: number, y0: number, x1: number, y1: number) => {
    const k = key(x0, y0);
    const list = edges.get(k);
    if (list) list.push([x1, y1]);
    else edges.set(k, [[x1, y1]]);
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!mask[r][c]) continue;
      if (!on(r - 1, c)) add(c, r, c + 1, r);
      if (!on(r, c + 1)) add(c + 1, r, c + 1, r + 1);
      if (!on(r + 1, c)) add(c + 1, r + 1, c, r + 1);
      if (!on(r, c - 1)) add(c, r + 1, c, r);
    }
  }

  const loops: Polyline[] = [];
  for (const [startKey, starts] of edges) {
    while (starts.length) {
      const sx = startKey % (cols + 1);
      const sy = Math.floor(startKey / (cols + 1));
      const pts: [number, number][] = [[sx, sy]];
      let [x, y] = starts.pop()!;
      while (!(x === sx && y === sy)) {
        pts.push([x, y]);
        const next = edges.get(key(x, y));
        if (!next?.length) break; // open chain — can't happen on a valid grid
        [x, y] = next.pop()!;
      }
      // Drop vertices that sit in the middle of a straight run.
      const n = pts.length;
      const out: number[] = [];
      for (let i = 0; i < n; i++) {
        const [px, py] = pts[(i - 1 + n) % n];
        const [cx, cy] = pts[i];
        const [nx, ny] = pts[(i + 1) % n];
        if ((px === cx && cx === nx) || (py === cy && cy === ny)) continue;
        out.push(cx, cy);
      }
      loops.push(out);
    }
  }
  return loops;
}

/** Row/column extent of a mask's filled cells. */
export function inkBounds(mask: Mask) {
  let top = Infinity;
  let bottom = -Infinity;
  let left = Infinity;
  let right = -Infinity;
  mask.forEach((row, r) =>
    row.forEach((v, c) => {
      if (!v) return;
      top = Math.min(top, r);
      bottom = Math.max(bottom, r);
      left = Math.min(left, c);
      right = Math.max(right, c);
    }),
  );
  return { top, bottom, left, right };
}

/**
 * Procedural gallop poses for Outline (§3.5 fallback, until designed poses
 * exist in Figma). Each pose shears the bottom half ±1–2 cells, leans the top
 * the other way, and strides the two stems: the left half of the bottom rows
 * steps one way while the right half steps the other, and whichever stem is
 * "tucked" lifts its bottom row. Stepped through with no in-betweens.
 *
 * `gentle` is the unified-phase version, for letters that weren't drawn as
 * legs: instead of a stride at its feet, a single narrow band of rows
 * nudges one cell sideways and travels from the top of the letter to the
 * bottom over the pose cycle. Only that band is displaced in any pose (the
 * Figma letters' 1-cell italic strokes split apart if neighbouring rows
 * shift in opposite directions), so the motion runs through the whole
 * letter while it keeps its silhouette.
 */
/** Gentle (unified) gallop: rows in the travelling band (it shifts one cell sideways). */
const BAND_ROWS = 2;

export function gallopPoses(mask: Mask, count = 6, gentle = false): Mask[] {
  const rows = mask.length;
  const cols = mask[0]?.length ?? 0;
  const ink = inkBounds(mask);
  const mid = Math.round(ink.top + (ink.bottom - ink.top) * 0.5);
  const centerCol = (ink.left + ink.right) / 2;
  return Array.from({ length: count }, (_, k) => {
    const phase = (k / count) * Math.PI * 2;
    const stride = Math.sin(phase);
    const out: Mask = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!mask[r][c]) continue;
        let dx: number;
        if (gentle) {
          // Band top steps from just above the letter to its baseline over the cycle; first pose is undisturbed.
          const bandTop = ink.top - BAND_ROWS + Math.round((k / count) * (ink.bottom - ink.top + BAND_ROWS + 1));
          dx = k > 0 && r >= bandTop && r < bandTop + BAND_ROWS ? 1 : 0;
        } else if (r >= mid) {
          const depth = (r - mid) / Math.max(1, ink.bottom - mid);
          dx = Math.round(1.6 * stride * depth);
          if (r >= ink.bottom - 1) {
            const leftStem = c < centerCol;
            dx += Math.round(leftStem ? stride : -stride);
            // The tucked stem lifts off the ground on its bottom row.
            if (r === ink.bottom && ((leftStem && stride > 0.5) || (!leftStem && stride < -0.5))) continue;
          }
        } else {
          dx = -Math.round(0.9 * Math.cos(phase) * ((mid - r) / Math.max(1, mid - ink.top)));
        }
        const nc = c + dx;
        if (nc >= 0 && nc < cols) out[r][nc] = true;
      }
    }
    return out;
  });
}

/** Everything derived from a letter's mask, computed once at load (spec §5) — never inside the frame loop. */
export type Derived = {
  /** Signed distance field per cell, negative inside (Cross-stitch shading). */
  sdf: number[][];
  /** Solid's thresholding field: the SDF with a partial 1-cell blur. */
  sdfBlurred: number[][];
  ink: ReturnType<typeof inkBounds>;
  outline: Polyline[];
  poses: { mask: Mask; outline: Polyline[] }[];
  /** The gentler gallop used in the unified phase (see gallopPoses). */
  gentlePoses: { mask: Mask; outline: Polyline[] }[];
};

const derivedCache = new WeakMap<Letter, Derived>();

/**
 * How much of the 1-cell blur goes into Solid's field. A full blur takes a
 * 1-cell-wide stroke's center to exactly 0, so at v = 0.5 those strokes would
 * vanish — and most of the Figma letters are drawn with 1-cell strokes. At
 * 0.3 a 1-cell stroke sits at -0.35, so it only breaks up near the bottom of
 * v's range (below ~0.38) while edges still flip organically as v drifts.
 */
const BLUR_MIX = 0.3;

export function prepare(letters: Letter[]) {
  for (const letter of letters) {
    const raw = sdf(letter.mask);
    const blurred = blur1(raw);
    const poses = gallopPoses(letter.mask);
    const gentlePoses = gallopPoses(letter.mask, 6, true);
    derivedCache.set(letter, {
      sdf: raw,
      sdfBlurred: raw.map((row, r) => row.map((d, c) => d + (blurred[r][c] - d) * BLUR_MIX)),
      ink: inkBounds(letter.mask),
      outline: traceOutline(letter.mask),
      poses: poses.map((mask) => ({ mask, outline: traceOutline(mask) })),
      gentlePoses: gentlePoses.map((mask) => ({ mask, outline: traceOutline(mask) })),
    });
  }
}

export function derived(letter: Letter): Derived {
  const d = derivedCache.get(letter);
  if (!d) throw new Error(`prepare() was never called for letter "${letter.char}"`);
  return d;
}
