# Dots renderer — rewrite ("a" in hannah)

This **replaces section 3.2 (Dots)** of `hannah-shin-motion-spec.md`. Delete the old behavior: overlapping blob radii, coin-flip ellipses, pink/white color split, and glyph re-forming. Keep the renderer signature and the mask-based architecture unchanged.

Reference images are in `dots-reference/`. Look at `03-closeup-glyph-levels.png` and `06-glyph-ladder-reference-colors.png` before writing code.

---

## What the reference actually does

1. **Every cell sits on a fixed grid and never moves or overlaps.** Nothing grows past its cell. The motion comes entirely from cells switching between a small set of glyphs.
2. **The glyphs form a 6-step tonal ladder**, like an ASCII brightness ramp made of circles (see `06-glyph-ladder-*.png`):

   | Level | Glyph | Approx. geometry (in cell units, cell = 1) |
   |---|---|---|
   | L0 | nothing (cell is empty, background shows) | — |
   | L1 | small thin ring | r = 0.26, stroke 0.05 |
   | L2 | large thin ring | r = 0.42, stroke 0.05 |
   | L3 | large ring + center dot | ring as L2, dot r = 0.07 |
   | L4 | large ring + small inner "c" (©-like) | ring as L2; inner arc r = 0.17, gap facing right (≈50°→310°), stroke 0.05 |
   | L5 | filled disc with the inner "c" knocked out in background color | disc r = 0.45; inner arc as L4, drawn in background color |

   Max radius is 0.45, so neighboring L5 discs nearly touch but never merge. That's what makes dense regions read as a tight tiled surface instead of blobs.

3. **A continuously flowing brightness field picks each cell's level.** The field churns fast: noticeable regions reshape every ~100ms (see `02-motion-100ms-steps.png`). Because it's quantized to 6 levels, the result looks like cells stepping between glyphs, even though the field underneath is smooth.
4. **The field has structure, not just noise.** Across the whole clip, the rim of the shape stays dense (L4–L5), the interior is sparser with open holes (L0–L2), and the lower part is denser than the upper part. The noise flows *through* this structure; it doesn't replace it.
5. **The bottom of the shape fades** under a gradient into the background.

---

## Build

### Field

For each filled cell `(x, y)` in the letter mask (cell coordinates):

```ts
// precomputed once
const d = -sdf(mask)[y][x];            // depth into the letter, >= 0 inside, in cells
const depthN = clamp(d / maxDepth, 0, 1); // 0 at the edge, 1 at the deepest point
const yN = y / (rows - 1);             // 0 top, 1 bottom

// per frame, t in seconds
const warpX = noise(x * 0.12, y * 0.12, t * 0.6 + seed) * 4;
const warpY = noise(x * 0.12 + 31.7, y * 0.12, t * 0.6 + seed) * 4;
const n = noise((x + warpX) * 0.18, (y + warpY) * 0.18, t * 1.4 + seed); // -1..1 → remap to 0..1

const rim = 1 - smoothstep(0.0, 0.55, depthN);   // bright near the edge
const lower = smoothstep(0.35, 1.0, yN);          // bright toward the bottom

let v = 0.55 * remap01(n) + 0.30 * rim + 0.15 * lower;
```

- Use **domain warping** (the warp terms above). Plain noise drifts in one direction and looks like scrolling. Warped noise boils and flows, which is what the reference does.
- Tune `t * 1.4` until the 100ms frames in `02-motion-100ms-steps.png` show about the same amount of change.
- Letters are thin compared with the reference's big circle, so `maxDepth` may only be 2–3 cells. If the rim term makes the whole "a" uniformly bright, reduce its weight to 0.2 and raise the noise weight.

### Quantize

```ts
const level = Math.min(5, Math.floor(v * 6));
```

- No tweening between levels. A cell draws exactly one glyph per frame.
- Optional hysteresis to reduce single-frame flicker: only change a cell's level if `|v - lastThreshold| > 0.03`. Try it with and without; the reference does have some flicker.

### Draw

- Draw each glyph centered in its cell using the geometry table. Scale strokes with cell size, with a minimum of 1px at 1× DPR.
- Draw the L5 knockout "c" in the **background color**, not as a transparent cut, unless the background is a gradient. In that case, use `globalCompositeOperation = "destination-out"` on an offscreen layer.
- Cells outside the mask draw nothing.
- After drawing, apply a gradient over the bottom 20% of the letter box, fading from transparent to the background color.

### Colors (monochrome)

| Role | Value |
|---|---|
| Background | `#0A0A0A` |
| Glyph strokes and fills | `#EBEBEB` |
| Bottom fade | to `#0A0A0A` |

If the piece flips to dark-on-light, swap these. The reference uses pale lavender `#DCE0FF` on blue `#2350FF`, which is useful for comparing your output side by side with the reference.

---

## Acceptance check

Render the "a" at the same size as `05-still-2.5s.png` and compare:

- [ ] No dot ever overlaps a neighbor.
- [ ] All 6 levels are visible in a single frame.
- [ ] The edge of the "a" stays denser than its interior over time.
- [ ] Regions visibly reshape within about 100ms, without the whole field sliding in one direction.
- [ ] The bottom fades out.
- [ ] Holding a debug key to freeze `t` produces a static frame that looks like one of the stills.
