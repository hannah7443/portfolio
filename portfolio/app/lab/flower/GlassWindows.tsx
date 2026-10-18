"use client";

import { LiquidGlass } from "apple-liquid-glass-webgl";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useHoverFigTree } from "../../components/spline/HoverFigTreeContext";
import {
  DEFAULT_FROST,
  FIGMA_ANTHERS,
  FIGMA_FRAME,
  FIGMA_PETALS,
  NAV_WINDOWS,
  type LabelCorner,
  type NavWindow,
} from "./_lib/navWindows";

// The glass nav windows over the flower, rebuilt with apple-liquid-glass-webgl
// (Figma's native Glass effect has no CSS export). One LiquidGlass instance on
// the artboard draws every window on a single shared WebGL canvas (`targets`)
// — the three.js scene already holds one context, and browsers cap them.
// Its default `backdrop: 'auto'` paints the three.js <canvas> underneath;
// FlowerThree calls LiquidGlass.refreshAll() right after each render so the
// glass keeps up with the animating scene.

/**
 * Where the Figma frame sits on the page: its top-left in container px and
 * container px per Figma px, horizontally (sx) and vertically (sy). Window
 * centres follow both, so they land on the same parts of the flower; window
 * sizes and chips use sx alone, so they keep Figma's proportions.
 */
export type Artboard = { left: number; top: number; sx: number; sy: number };

/**
 * Figma Glass → library settings, matched by eye against the Figma screenshot.
 * There's no CSS stroke, so the glass defines its own edges: a light contour
 * (hairline), edge light (rim) and a glint on the lit edge (highlight), plus
 * enough dark tint that each pane reads as faintly lifted off the black page.
 */
const GLASS = {
  tint: 0.3,
  tintTone: "dark" as const,
  material: {
    hairline: 1.4,
    hairWidth: 0.9,
    rim: 0.6,
    highlight: 0.7,
    dispersion: 4, // keep the orange/blue edge fringes visible
    lightAngle: -135, // light from the top-left (screen coordinates, y down)
  },
};

/**
 * Figma's frost is a blur radius in px; the library's is a ratio of the
 * window's short side. A straight conversion (22 / short side) came out
 * visibly sharper than Figma's soft blob, so it's scaled up by eye.
 */
const FROST_MATCH = 2;

/**
 * Pulls every window toward the middle of the flower so they cover more of
 * it (Hannah's call; the Figma layout sits further out). Each window's centre
 * moves this share of the way in; sizes don't change. 0 = Figma positions.
 */
const PULL_IN = 0.15;
/** The middle of the flower in Figma px: centred between the petals, halfway from the stamen tips to the petals' lowest point. */
const FLOWER_CENTRE = {
  x: (FIGMA_PETALS.left + FIGMA_PETALS.right) / 2,
  y: (FIGMA_ANTHERS.y + FIGMA_PETALS.bottom) / 2,
};
const pulledCentre = (w: NavWindow) => ({
  x: w.x + w.w / 2 + (FLOWER_CENTRE.x - (w.x + w.w / 2)) * PULL_IN + (w.nudge?.x ?? 0),
  y: w.y + w.h / 2 + (FLOWER_CENTRE.y - (w.y + w.h / 2)) * PULL_IN + (w.nudge?.y ?? 0),
});
const frostRatio = (w: NavWindow) =>
  Math.min(1, (FROST_MATCH * (w.frost ?? DEFAULT_FROST)) / Math.min(w.w, w.h));

const CHIP_CORNER: Record<LabelCorner, string> = {
  "top-left": "left-0 top-0",
  "top-right": "right-0 top-0",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
};

export default function GlassWindows({ artboard }: { artboard: Artboard }) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const windowRefs = useRef<(HTMLElement | null)[]>([]);

  // Construct on the client after mount; destroy on unmount (safe under StrictMode's double mount).
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const targets = NAV_WINDOWS.flatMap((w, i) => {
      const element = windowRefs.current[i];
      return element
        ? [{ element, frost: frostRatio(w), shape: "rect" as const, radius: 0 }]
        : [];
    });
    const glass = new LiquidGlass(board, { targets, ...GLASS });
    return () => glass.destroy();
  }, []);

  const { width: FW, height: FH } = FIGMA_FRAME;

  return (
    <div
      ref={boardRef}
      // z-10: above the hover overlays' click-catchers (z-5), like the homepage's nav boxes.
      className="pointer-events-none absolute z-10"
      style={{
        left: artboard.left,
        top: artboard.top,
        width: FW * artboard.sx,
        height: FH * artboard.sy,
        // Figma px → page px, for the chips' type and padding.
        ["--s" as string]: artboard.sx,
      }}
    >
      {NAV_WINDOWS.map((w, i) => {
        const c = pulledCentre(w);
        const k = artboard.sx * (w.depth ?? 1); // size scale: Figma px → page px, times the window's depth
        return (
          <GlassWindow
            key={w.node}
            window={w}
            style={{
              // Centre mapped with (sx, sy); size with sx and the window's depth, around that centre.
              left: c.x * artboard.sx - (w.w * k) / 2,
              top: c.y * artboard.sy - (w.h * k) / 2,
              width: w.w * k,
              height: w.h * k,
            }}
            elementRef={(el) => {
              windowRefs.current[i] = el;
            }}
          />
        );
      })}
    </div>
  );
}

// No stroke: Hannah asked for the Figma's 2px grey border to be dropped, so the glass edge stands alone.
const WINDOW = "glass-window absolute block rounded-none";
const FOCUS =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

function GlassWindow({
  window: w,
  style,
  elementRef,
}: {
  window: NavWindow;
  style: CSSProperties;
  elementRef: (el: HTMLElement | null) => void;
}) {
  const { activate } = useHoverFigTree();

  // Decorative: hidden from assistive tech, not focusable, and click-through so it never
  // blocks the labeled window it overlaps.
  if (!w.label)
    return (
      <div
        ref={elementRef}
        data-node={w.node}
        aria-hidden
        className={`${WINDOW} pointer-events-none`}
        style={style}
      />
    );

  const chip = <Chip label={w.label} corner={w.labelAt ?? "top-left"} />;
  if (w.overlay) {
    const overlay = w.overlay;
    // No page yet: opens the homepage's full-screen hover overlay, on hover like the
    // homepage marker, and on focus/click so it works from the keyboard and on touch.
    return (
      <button
        ref={elementRef}
        data-node={w.node}
        type="button"
        className={`${WINDOW} ${FOCUS} pointer-events-auto cursor-pointer bg-transparent p-0`}
        style={style}
        aria-label={`${w.label} — show playground`}
        onMouseEnter={() => activate(overlay)}
        onFocus={() => activate(overlay)}
        onClick={() => activate(overlay)}
      >
        {chip}
      </button>
    );
  }
  return (
    <Link
      ref={elementRef}
      data-node={w.node}
      href={w.href ?? "/"}
      className={`${WINDOW} ${FOCUS} pointer-events-auto`}
      style={style}
    >
      {chip}
    </Link>
  );
}

function Chip({ label, corner }: { label: ReactNode; corner: LabelCorner }) {
  return (
    <span
      className={`absolute ${CHIP_CORNER[corner]} whitespace-nowrap bg-white text-center uppercase text-[#6d6d6d]`}
      style={{
        // Figma: ABC Favorit Mono Medium 16px, tracking -0.64px, 4px side padding. IBM Plex Mono
        // Medium stands in until Favorit is licensed for the project.
        fontFamily:
          'var(--font-ibm-plex-mono), "IBM Plex Mono", ui-monospace, monospace',
        fontWeight: 500,
        fontSize: "calc(16px * var(--s))",
        letterSpacing: "-0.04em",
        lineHeight: "normal",
        padding: "0 calc(4px * var(--s))",
      }}
    >
      {label}
    </span>
  );
}
