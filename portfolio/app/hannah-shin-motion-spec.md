# "hannah shin" — Mixed Media Letters motion spec

Build target: `/lab/name` route in the portfolio repo (React, deployed on Vercel). One `<canvas>`, one `requestAnimationFrame` loop, time-based (not frame-based) animation.

Source of letter geometry: the **Mixed Media Letters** frame in the Figma file `Portfolio` (node `866-6474`). Pull it with the Figma MCP or an SVG export.

---

## 1. Architecture

Every letter is a **grid mask**. Every motion style is a **renderer**.

```ts
type Mask = boolean[][];                  // [row][col], true = filled cell, exported from Figma rects
type Letter = {
  char: string;
  mask: Mask;
  vector?: Shape[];                       // only needed for the Morph style (see 3.6)
  ownStyle: StyleId;                      // the style it uses in the "individual" phase
  seed: number;                           // per-letter noise seed so letters never move in sync
};
type Renderer = (ctx, letter: Letter, box: Rect, t: number, p: StyleParams) => void;
```

The timeline (section 4) decides, for each letter at time `t`, which renderer is active: `"rest"`, the letter's `ownStyle`, or a shared `unifiedStyle`. Swapping styles is a state change, not a redesign.

Helpers needed by several styles:
- `sdf(mask)` gives the signed distance field per cell, in cell units (negative inside the letter). It's used by Solid, Cross-stitch, and Outline.
- `resample(mask, factor)` gives a coarser or finer mask using a threshold on average coverage. It's used by ASCII.
- `traceOutline(mask)` gives closed polylines along cell edges (marching squares on the grid lines). It's used by Outline.
- Seeded 3D simplex noise `noise(x, y, t)`.

---

## 2. Letter assignments

| Position | Letter | Own style |
|---|---|---|
| hannah — 1 | h | Solid (threshold breathing) |
| hannah — 2 | a | Dots |
| hannah — 3 | n | ASCII |
| hannah — 4 | n | Outline gallop |
| hannah — 5 | a | Cross-stitch |
| hannah — 6 | h | Morph |
| shin — 1 | s | Solid (threshold breathing) |
| shin — 2 | h | ASCII (per Figma) |
| shin — 3 | i | Morph |
| shin — 4 | n | Outline gallop |

The **rest** state is every letter as a plain solid mask with no motion. It's the hinge between every phase of the timeline.

---

## 3. Style specs

### 3.1 Solid — threshold breathing (ref video 1)

**What's happening in the reference:** bitmap serif letters, each labeled with a small value (about 0.28–0.59) that drifts independently. As the value moves, the letter gets re-rasterized. Strokes thicken and thin, edge cells flip on and off, and thin terminals detach into floating squares (the "c" terminal becomes an isolated block). Everything settles to 0.500 at the end. Changes are discrete cell flips, never tweens.

**Build:**
- Use the precomputed `sdf(mask)`, slightly blurred (1 cell Gaussian) so thresholds produce organic edges.
- Each frame: `v = 0.5 + 0.15 * noise(seed, t * 0.35)`. A cell is on if `sdf < (v - 0.5) * 3`.
- Draw only full cells with no anti-aliasing between them. The pixel snap is the point.
- Optional detail from the reference: a tiny monospace readout of `v.toFixed(3)` under the letter (9–10px, 60% opacity).
- Optional: a vertical gradient fill on the cells (full color at the top, about 70% at the bottom).
- Motion should be slow and calm. This is the "quiet" style that anchors the composition.

### 3.2 Dots (ref video 2)

> **Superseded** by `reference/dots-reference/DOTS-FIX.md` (fixed-grid 6-level glyph ladder). The text below is the original draft, kept for history.

**What's happening:** the letter is a grid of circles on a saturated background. Dot radius varies wildly, from pinpoints to dots large enough to overlap neighbors and merge into blobs, and the large-dot regions travel across the letter like a wave. There are two dot colors (white and pink). Some dots briefly squash into flat ellipses, as if a coin is flipping. The glyph itself re-forms about every 0.4s. The bottom fades into the background.

**Build:**
- One dot per filled cell, centered in the cell.
- Radius: `r = cell * lerp(0.08, 0.8, smoothstep(0.3, 0.9, noise(x*0.25, y*0.25, t*0.9 + seed)))`. Going above 0.5 is intentional so neighbors overlap.
- Color: a second noise channel picks white or pink, with a threshold around 0.55. Re-sample it with a lower frequency so colors drift in patches rather than flickering.
- Flip: each tick, about 2% of dots start a 250ms flip. `scaleY` goes 1 → 0.15 → 1 with ease-in-out, so the dot reads as an ellipse mid-flip.
- Glyph re-form (optional): if Hannah designs 2–3 alternate "a" masks in Figma, step between them about every 0.4–0.8s. Dots carry their current radius into the new cell layout. Cells that disappear shrink to 0 over 120ms, and new cells grow from 0.
- Bottom 20% of the letter box gets a gradient overlay to the background color.

### 3.3 Cross-stitch (ref video 3)

> **Changed:** no 3D rotation — the letter keeps its exact shape. Motion comes from the stitch tones: a light sweeping side to side across each letter brightens the far edge stitches, and scattered stitches churn bright.

**What's happening:** objects are rendered as a grid of "×" stitches on an off-white ground, two-toned: pale blue base stitches with dark blue stitches for shading and edges. The object rotates in 3D. Its silhouette squashes, collapses to a thin strip edge-on, and expands again. Shading moves across the surface as it turns. Everything snaps to the stitch grid.

**Build:**
- Treat the letter as an extruded slab rotating around its vertical axis. Use `θ = t * 0.9 + seed` and a slight X tilt of `±10°` on a slower sine.
- Each frame, project into stitch space. Horizontal scale is `cos θ` (with a minimum of about 0.12 so it never fully vanishes), plus a small perspective skew. Then re-quantize to the stitch grid by sampling the source mask through the inverse transform. When `|cos θ|` is small, show 1–2 columns of "side wall" stitches, all in the dark tone.
- Shading: compute the light direction `L` from θ. A stitch is dark if it's within 1.5 cells of the boundary on the side facing away from `L`, or if `noise(x, y, t*0.5) > 0.72`, which gives scattered dark stitches like the reference.
- Stitch drawing: two diagonal strokes per cell, inset 18%, line width about 1.5px at 1× DPR, with round caps.
- No anti-aliased rotation. Keep the snapping.

### 3.4 ASCII (ref video 4)

> **Changed:** the resolution steps (grid stepping coarser over time) were removed — ASCII cells keep one size throughout, in both the individual and unified phases. Treatments follow the Figma's grey blocks rather than pink/green.

**What's happening:** the whole background is a field of dim "=" characters in a monospace grid on black. Inside the letters, cells hold random characters (A–Z, a–z, `@ ^ \ > ? [ \``) that keep re-rolling. Some cells are inverted blocks: black on white, black on pink, or white on green. Some "=" also appear inside the letters. Over about 9s, the grid resolution steps coarser in discrete jumps, so the letters go from crisp to barely legible.

**Build:**
- Background: fill the letter's box (or the whole canvas, if this style is unified) with "=" in gray `#555` on black.
- Letter cells, drawn per cell:
  - Character: re-roll with probability 0.15 per tick, at a tick rate of 10Hz.
  - Treatment, re-rolled less often (about 0.03 per tick): 55% plain white glyph, 15% white block with black glyph, 12% pink block with black glyph, 10% green block with white glyph, 8% "=".
- Resolution steps: cycle `factor` through `[1, 1.5, 2, 3]` and back. Hold about 2s at each step, with a hard cut between steps. Recompute the mask with `resample(mask, factor)`. Character size is `cell * factor * 0.8`.
- Font: any monospace stack (e.g. `"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace`).

### 3.5 Outline gallop (ref video 5)

**What's happening:** a single indigo outline traces the stair-stepped boundary of a pixel shape on graph paper. The shape loops through 6–8 distinct poses of a gallop (Muybridge-style) at about 0.31s per pose. It's choppy and stepped, with no in-betweens. The outline always follows the grid lines.

**Build:**
- Background: cream paper with a faint grid whose spacing equals the letter's cell size.
- Stroke: `traceOutline(mask)` → path along cell edges. Color is deep indigo, about 2px wide, with square joins.
- Poses: the letter needs 6 pose masks, designed in Figma as grid frames. Both letters here are "n", and **the two stems of an n are legs**: alternate them like a stride (one stem forward/extended, the other tucked; the arch leans forward and then back). Step through the poses at 310ms each, looping, with no interpolation.
- Fallback if the poses aren't designed yet: generate them procedurally by shearing the bottom half of the mask (`±1–2` cells) and offsetting each stem's bottom row on alternating frames.

### 3.6 Morph (ref video 6, the Config letters)

> **Superseded:** the Figma h and i primitives now stay in place and flicker through a six-level ladder driven by the same field as Dots (see `lab/name/_lib/renderers/morph.ts`). The text below is the original draft, kept for history.

**What's happening:** each letter is built from 1–3 chunky geometric primitives (a gear, an arch, stacked pills, a circle plus a diamond). On a staggered left-to-right cascade, each letter morphs into one basic shape (hexagon, square, arch, pill, circle, triangle), holds about 1.5s, and then morphs back. During each morph the shape tilts slightly and overshoots. The fill is a light vertical gradient on a dark ground.

**Build:**
- This is the one style that isn't grid-based. Each Morph letter needs a `vector` definition as SVG paths from Figma:
  - **h**: an arch (top) plus a rectangle stem. Rest shape: arch. Alternate shape: square.
  - **i**: a pill stem plus a circle dot. Rest shape: circle. Alternate shape: pill.
- Use path interpolation with `flubber` (npm), or blend between SDFs if rendering in WebGL.
- Timing: each morph lasts 600ms with a spring ease that overshoots about 8%. Add rotation of `±6°` peaking mid-morph and returning to 0. Stagger the letters by 140ms from left to right. Hold about 1.5s on the simple shape, then morph back.
- Decision for Hannah: render the vector smoothly (true to the reference), or quantize it to the grid each frame (cohesive with the other styles).

---

## 4. Timeline (modeled on the SFABF reference)

What the SFABF piece does:
- The **clean solid** state is the hinge. Every effect phase starts and ends there.
- Phase changes are **hard cuts**, not crossfades.
- In the individual phase, letters enter their effects **staggered and overlapping** (about 0.2s apart, not strictly left-to-right), and some drop back to solid while others are still animating. The phase is never fully in sync.
- In the unified phase, **all letters share one effect at the same moment**, which reads as the whole word becoming one material.
- Between bigger beats, letters **pop out and back in one at a time** (the "2 _ _ 6" → "2026" beat).

Proposed loop (tune by feel; the live timing is `SEQUENCE` in `lab/name/_lib/timeline.ts`). Every rest now ends with a 0.6s **still** beat: the breathing holds where it was and only a faint flicker remains, before the next phase.

| Time | Phase | Behavior |
|---|---|---|
| 0.0–0.8s | Rest | All letters solid, breathing (Solid's threshold motion; changed from "still"). |
| 0.8–5.0s | Individual | Each letter switches to its `ownStyle` at a random offset in 0–0.6s. During the phase, each letter has a 30% chance of a 0.3–0.5s dip back to solid. |
| 5.0–6.6s | Rest | Hard cut back to solid; held longer (was 0.4s) to show the breathing before unified. |
| 6.6–10.2s | Unified | All letters switch to `unifiedStyle` on the same frame (or with a 40ms left-to-right stagger). |
| 10.2–12.4s | Rest | Hard cut back to solid, held a little longer before splitting again. (The "pop" beat that was here was dropped.) |
| 12.4–15.8s | Individual | Repeats the individual phase so the loop ends on variety. |

`unifiedStyle` rotates each loop through `ascii → dots → crossStitch → outline → solid`. Morph only joins the rotation if every letter has a `vector` definition. Outline in unified mode can skip the pose cycle and just trace each letter's rest mask, which still reads as the outline style.

---

## 5. Implementation notes

- **Seeded randomness:** use a seeded PRNG and noise so the loop looks the same on every visit and screenshots are reproducible.
- **Performance:** cache SDFs, outlines, and resampled masks at load. Only per-frame values should be computed in the loop. Respect `devicePixelRatio`. Pause the loop when the canvas is offscreen (IntersectionObserver) or the tab is hidden.
- **Reduced motion:** if `prefers-reduced-motion: reduce` is set, show the rest state and step through each style as a still on click.
- **Debug panel** (dev only):
  - Keys `1`–`6` force a unified style.
  - `0` resumes the timeline.
  - Space pauses.
  - A slider scrubs `t`.
  - A toggle shows the grid.
- **Palette (decision for Hannah):** each reference brings its own palette. The SFABF piece feels cohesive because every effect uses one blue on one paper color. The suggested default is a single shared ink color and background across all styles, with per-style accent colors (pink, green) used sparingly inside that palette.

---

## 6. Build order

1. Export masks from Figma and build the data structures. Render the rest state.
2. Build the timeline engine and the debug panel, using only the Solid renderer.
3. ASCII renderer.
4. Dots renderer.
5. Outline renderer, using the procedural pose fallback first.
6. Cross-stitch renderer.
7. Morph renderer (needs vector definitions).
8. Tune timing by feel. Swap in Figma-designed outline poses and alternate "a" masks.
