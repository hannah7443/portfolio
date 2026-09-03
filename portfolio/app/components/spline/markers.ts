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
};

export type NavMarker = MarkerOffset & {
  kind: "nav";
  name: string;
  href: string;
  label: string;
  /** Preview thumbnail shown on hover, e.g. "/images/work-buttons/fig-tree.png" */
  thumbnail: string;
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
    offsetX: 20,
    offsetY: 30,
  },
  {
    kind: "nav",
    name: "playground-marker",
    href: "/playground",
    label: "playground",
    thumbnail: "/artwork/Mary-Oliver.MOV",
  },
  {
    kind: "nav",
    name: "case-study-marker",
    href: "/work/fig-tree",
    label: "case studies",
    thumbnail: "/images/work-buttons/fig-tree.png",
  },
  {
    kind: "nav",
    name: "full-stack-marker",
    href: "/full-stack",
    label: "full-stack",
    thumbnail: "/images/work-buttons/fig-tree.png",
  },

  // Decorative slots actually authored in the scene. Only two effects are
  // built so far (shader-gradient, liquid-logo) — assigned to two of the
  // right-side slots to roughly match the screenshot's layout. The rest are
  // listed but left unassigned (kind: "texture" with no matching effect in
  // TextureEffectBox renders nothing) — reassign any of these to
  // "shader-gradient" / "liquid-logo" / "ascii" as you build more effects.
  { kind: "texture", name: "right-deco-marker-1", effect: "shader-gradient" },
  { kind: "texture", name: "right-deco-marker-2", effect: "liquid-logo" },
  { kind: "texture", name: "right-deco-marker-3", effect: "ascii" },
  { kind: "texture", name: "right-corner-deco-marker-2", effect: "ascii" },
  { kind: "texture", name: "left-deco-marker-1", effect: "ascii" },
  { kind: "texture", name: "left-deco-marker-2", effect: "ascii" },
  { kind: "texture", name: "left-deco-marker-3", effect: "ascii" },
  { kind: "texture", name: "left-corner-deco-marker-2", effect: "ascii" },
  { kind: "texture", name: "about-deco-marker", effect: "ascii" },
  { kind: "texture", name: "full-stack-deco-marker", effect: "ascii" },
];
