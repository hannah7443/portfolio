// Core data structures for the "hannah shin" Mixed Media Letters piece —
// see app/hannah-shin-motion-spec.md §1. Every letter is a grid mask;
// every motion style is a renderer.

export type Mask = boolean[][]; // [row][col], true = filled cell

export type StyleId = "solid" | "dots" | "crossStitch" | "ascii" | "outline" | "morph";

/** What a letter shows at a given moment: the rest hinge (breathing solid), the frozen end of a rest, or a style. */
export type Slot = StyleId | "rest" | "still";

/** One primitive of a Morph letter's vector art (§3.6), in Figma px relative to the letter's own box. */
export type Shape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number }
  | { kind: "poly"; points: number[] }; // flat [x0, y0, x1, y1, ...]

/** A letter's vector art: its primitives plus the Figma box they sit in (bottom-aligned with the mask). */
export type VectorArt = { width: number; height: number; shapes: Shape[] };

export type Letter = {
  char: string;
  mask: Mask;
  vector?: VectorArt;
  ownStyle: StyleId;
  seed: number; // per-letter noise seed so letters never move in sync
  /** Where the (padded) mask sits in the Figma composition, in Figma px: bottom-left corner + cell size. */
  place: { left: number; bottom: number; pitchX: number; pitchY: number };
};

/**
 * A letter's box on the canvas, in device pixels. `cw`/`ch` are its whole-
 * device-pixel cell width/height — square for most letters, taller for the
 * two ASCII letters, matching the Figma.
 */
export type Rect = { x: number; y: number; w: number; h: number; cw: number; ch: number };

export type StyleParams = {
  paper: string;
  /** "r, g, b" so renderers can vary alpha. */
  ink: string;
  /** The Figma's two greys (its ASCII blocks): light #d9d9d9, dark #888. */
  light: string;
  dark: string;
  dpr: number;
  /**
   * Solid only, set during the still beat: freeze the breathing at `breathAt`
   * (global seconds) and scale the per-cell flicker down by `flickerScale`.
   */
  solidHold?: { breathAt: number; flickerScale: number };
};

/** Per-draw context a renderer may need beyond the global clock. */
export type RenderInfo = {
  /** Global time (seconds) at which this letter entered its current style. */
  since: number;
  /** The letter's position in the name, 0–9 (left to right). */
  index: number;
  /** True while every letter shares one style (the unified phase, or a forced style). */
  unified: boolean;
};

export type Renderer = (
  ctx: CanvasRenderingContext2D,
  letter: Letter,
  box: Rect,
  t: number,
  p: StyleParams,
  info: RenderInfo,
) => void;

export type StyleDef = {
  draw: Renderer;
};
