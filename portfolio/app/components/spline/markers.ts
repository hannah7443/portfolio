/**
 * One entry per named object placed in the Spline scene (the 0%-opacity
 * placeholder layers). `name` MUST exactly match the layer name authored in
 * Spline. Adding a new tracker later: duplicate a layer in Spline, rename
 * it, then add one entry here — no other code needs to change.
 */
type MarkerOffset = {
  /**
   * Fine-tuning nudge in screen pixels, applied on top of the computed
   * projected position — for small corrections without going back into
   * Spline. Positive x moves right, positive y moves down. Omit for none.
   */
  offsetX?: number;
  offsetY?: number;
  /** Multiplies this marker's box size (both width and height) on top of the usual computed size. Omit for 1 (no change). */
  sizeScale?: number;
  /** Multiplies just the box's height on top of sizeScale — for flattening a box without narrowing it. Omit for 1 (no change). */
  heightScale?: number;
};

export type NavMarker = MarkerOffset & {
  kind: "nav";
  name: string;
  href: string;
  label: string;
  /** Preview thumbnail shown on hover, e.g. "/images/work-buttons/fig-tree.png" */
  thumbnail: string;
  /**
   * Lets the label wrap onto multiple lines within the box's normal size,
   * instead of the default behavior of widening the box to fit the label
   * on one line. Use for long labels where a wide box reads worse than a
   * couple lines of text. Omit for false (single line, box widens).
   */
  wrapLabel?: boolean;
  /**
   * On hover, sticks the full-screen hover-fig-tree design (see
   * HoverFigTree.tsx) on behind the flower — it stays up after the cursor
   * leaves this box until the user navigates to another nav marker's page.
   */
  triggersHoverOverlay?: boolean;
};

export type TextureMarker = MarkerOffset & {
  kind: "texture";
  name: string;
  effect: "ascii" | "shader-gradient" | "liquid-logo";
};

export type Marker = NavMarker | TextureMarker;

export const MARKERS: Marker[] = [
  {
    kind: "nav",
    name: "about-marker",
    href: "/about",
    label: "about",
    thumbnail: "/Profile-picture.jpg",
    offsetX: 5,
    offsetY: 0,
    heightScale: 0.6,
  },
  {
    kind: "nav",
    name: "playground-marker",
    href: "/playground",
    label: "playground",
    thumbnail: "/artwork/Mary-Oliver.MOV",
    heightScale: 0.7,
  },
  {
    kind: "nav",
    name: "case-study-marker",
    href: "/work/fig-tree",
    label: "fig tree",
    thumbnail: "/images/work-buttons/fig-tree.png",
    heightScale: 0.7,
    offsetY: 35,
    offsetX: 7,
    triggersHoverOverlay: true,
  },
  {
    kind: "nav",
    name: "full-stack-marker",
    href: "/full-stack",
    label: "Building Radio's Future",
    thumbnail: "/images/work-buttons/fig-tree.png",
    heightScale: 0.8,
    offsetX: -10,
    offsetY: 50,
    wrapLabel: true,
    sizeScale: 1.5,
  },

  // Decorative slots actually authored in the scene. Only two effects are
  // built so far (shader-gradient, liquid-logo) — assigned to two of the
  // right-side slots to roughly match the screenshot's layout. The rest are
  // listed but left unassigned (kind: "texture" with no matching effect in
  // TextureEffectBox renders nothing) — reassign any of these to
  // "shader-gradient" / "liquid-logo" / "ascii" as you build more effects.
  { kind: "texture", name: "right-deco-marker-1", effect: "ascii", offsetY: -10},
  { kind: "texture", name: "right-deco-marker-2", effect: "ascii", offsetY: -10},
  { kind: "texture", name: "right-deco-marker-3", effect: "ascii", offsetY: -10 },
  { kind: "texture", name: "right-corner-deco-marker-2", sizeScale: 0.8, effect: "ascii", offsetX: -40},
  { kind: "texture", name: "right-corner-deco-marker-3", effect: "ascii", sizeScale: 0.8, offsetX: -30 },
  { kind: "texture", name: "left-deco-marker-1", effect: "ascii", sizeScale: 0.8, offsetX: -20, offsetY: -10 },
  { kind: "texture", name: "left-deco-marker-2", effect: "ascii", sizeScale: 0.8, offsetX: -20, offsetY: -10 },
  { kind: "texture", name: "left-deco-marker-3", effect: "ascii", sizeScale: 0.8, offsetX: -20, offsetY: -10 },
  { kind: "texture", name: "left-corner-deco-marker-2", effect: "ascii", sizeScale: 0.6, offsetX: -15, offsetY: 35 },
  { kind: "texture", name: "about-deco-marker", effect: "ascii", sizeScale: 0.5, offsetX: -10 },
  { kind: "texture", name: "full-stack-deco-marker", effect: "ascii", sizeScale: 1.2, offsetX: -15, offsetY: 10, heightScale: 0.7 },
  { kind: "texture", name: "full-stack-deco-marker-2", effect: "ascii", sizeScale: 1.0, offsetX: -20, offsetY: 25, heightScale: 0.7 },
];
