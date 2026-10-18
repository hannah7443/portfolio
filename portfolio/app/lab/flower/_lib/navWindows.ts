import type { HoverOverlayId } from "../../../components/spline/HoverFigTreeContext";

// The glass nav windows that float over the flower — Figma "Mixed Media
// Letters" (file MAeeEAh3liNy9GGgvPD6eK, frame 866:6474, 1728×1117).
// Coordinates are Figma frame px; GlassWindows maps the whole frame onto the
// page so the Figma flower lines up with the rendered three.js one.

export const FIGMA_FRAME = { width: 1728, height: 1117 };

/**
 * Where the flower sits in the Figma screenshot (measured from its pixels):
 * the anchor between the design and the live three.js flower. The Figma
 * flower was captured from a slightly different camera angle, so it maps on
 * with separate horizontal and vertical scales: the petals' width sets the
 * horizontal one, the stamen tips down to the petals' lowest point the
 * vertical one, and the tips' centroid the position.
 */
export const FIGMA_PETALS = { left: 645, right: 1135, bottom: 743 };
export const FIGMA_ANTHERS = { x: 887.9, y: 327.2 };

export type LabelCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type NavWindow = {
  node: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Labeled windows are interactive; unlabeled ones are decorative. */
  label?: string;
  labelAt?: LabelCorner;
  /** A labeled window either links to a page… */
  href?: string;
  /** …or, with no page yet, opens one of the homepage's full-screen hover overlays (on hover, focus or click). */
  overlay?: HoverOverlayId;
  /** Figma Glass frost (blur radius, Figma px). Default 22. */
  frost?: number;
  /** Extra offset in Figma px, applied after the pull toward the flower (negative y = up). */
  nudge?: { x?: number; y?: number };
  /**
   * Size multiplier around the window's centre, so the windows read as sitting
   * at different depths around the flower: nearest (FIGTREE, PLAYGROUND)
   * largest, ABOUT furthest and smallest. Decorative windows share the depth
   * of the labeled window they overlap. Default 1.
   */
  depth?: number;
  /** Sits "between" the petals and the stem: the stamens and stem draw crisp on top of this window's glass, the petals stay behind it. */
  stemInFront?: boolean;
};

/** In Figma's layer order: the decorative windows sit on top of the labeled ones they overlap. */
/** Window sizes by depth (see NavWindow.depth). */
const NEAR = 1.2;
const MID = 0.9;
const FAR = 0.8;

export const NAV_WINDOWS: NavWindow[] = [
  // ABOUT and the small window over it (866:6498) sit a little higher than the pull would put them.
  { node: "866:6488", x: 735, y: 147, w: 208, h: 105, label: "ABOUT", labelAt: "top-left", href: "/about", nudge: { y: -40 }, depth: FAR },
  { node: "866:6491", x: 485, y: 221, w: 208, h: 105, label: "HOME", labelAt: "bottom-left", href: "/", depth: MID },
  // Figma's label reads "BUIDLING"; corrected here.
  { node: "866:6494", x: 1047, y: 214, w: 304, h: 138, label: "BUILDING RADIO'S FUTURE", labelAt: "top-right", href: "/work/radio", depth: MID },
  { node: "866:6484", x: 544, y: 495, w: 124, h: 199, label: "FIGTREE", labelAt: "bottom-left", href: "/work/fig-tree", depth: NEAR },
  // Figma: frost 10, depth 90 (the library's depth/refraction is shared across one canvas, so only frost differs).
  { node: "866:6481", x: 1024, y: 523, w: 232, h: 143, label: "PLAYGROUND", labelAt: "bottom-right", overlay: "playground", frost: 10, depth: NEAR },
  { node: "866:6497", x: 550, y: 302, w: 124, h: 99, depth: MID }, // with HOME
  { node: "866:6498", x: 754, y: 225, w: 85, h: 125, nudge: { y: -40 }, stemInFront: true, depth: FAR }, // with ABOUT
  { node: "866:6500", x: 1016, y: 289, w: 162, h: 125, depth: MID }, // with BUILDING RADIO'S FUTURE
  { node: "866:6487", x: 606, y: 545, w: 124, h: 99, depth: NEAR }, // with FIGTREE
  { node: "866:6499", x: 981, y: 495, w: 85, h: 125, depth: NEAR }, // with PLAYGROUND
];

/** Figma's default frost for these windows. */
export const DEFAULT_FROST = 22;
